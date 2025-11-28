import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Participant } from '@shared/schema';

interface VoiceChatProps {
    socket: Socket;
    roomCode: string;
    userId: string;
    participants: Participant[];
    isMuted: boolean;
    onMuteChange: (muted: boolean) => void;
    isHandRaised: boolean;
    onHandRaiseChange: (raised: boolean) => void;
}

export function VoiceChat({
    socket,
    roomCode,
    userId,
    participants,
    isMuted,
    onMuteChange,
    isHandRaised,
    onHandRaiseChange
}: VoiceChatProps) {
    const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    // Refs for VAD state to avoid closure staleness and excessive re-renders
    const isMutedRef = useRef(isMuted);
    const lastSpeakingState = useRef(false);
    const speakingHoldTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync isMuted prop to ref
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        // Initialize audio
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                setLocalStream(stream);

                // Setup VAD
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                checkAudioLevel();

                // Join voice channel logic would go here (initiating connections)
                // For mesh, we connect to everyone already in the room
                participants.forEach(p => {
                    if (p.id !== userId && !peersRef.current[p.socketId]) {
                        createPeer(p.socketId, p.id, true);
                    }
                });

            } catch (err) {
                console.error('Error accessing microphone:', err);
            }
        };

        initAudio();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (speakingHoldTimeout.current) {
                clearTimeout(speakingHoldTimeout.current);
            }
            Object.values(peersRef.current).forEach(peer => peer.close());
        };
    }, []);

    // Handle signaling
    useEffect(() => {
        socket.on('voice-signal', async ({ userId: senderId, signal }) => {
            const peer = peersRef.current[senderId];
            if (peer) {
                if (signal.type === 'offer') {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('voice-signal', { targetId: senderId, signal: answer });
                } else if (signal.type === 'answer') {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal));
                } else if (signal.candidate) {
                    await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } else {
                // Incoming connection from someone we didn't initiate to
                // Find participant by socketId (senderId is socketId here based on server logic)
                const participant = participants.find(p => p.socketId === senderId);
                if (participant) {
                    const newPeer = createPeer(senderId, participant.id, false);
                    if (signal.type === 'offer') {
                        await newPeer.setRemoteDescription(new RTCSessionDescription(signal));
                        const answer = await newPeer.createAnswer();
                        await newPeer.setLocalDescription(answer);
                        socket.emit('voice-signal', { targetId: senderId, signal: answer });
                    }
                }
            }
        });

        return () => {
            socket.off('voice-signal');
        };
    }, [participants]);

    // Handle participants update (new users joining)
    useEffect(() => {
        participants.forEach(p => {
            if (p.id !== userId && !peersRef.current[p.socketId]) {
                createPeer(p.socketId, p.id, true);
            }
        });
    }, [participants]);

    const createPeer = (targetSocketId: string, targetUserId: string, initiator: boolean) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current!);
            });
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice-signal', {
                    targetId: targetSocketId,
                    signal: { candidate: event.candidate }
                });
            }
        };

        peer.ontrack = (event) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play();
        };

        if (initiator) {
            peer.createOffer().then(offer => {
                peer.setLocalDescription(offer);
                socket.emit('voice-signal', {
                    targetId: targetSocketId,
                    signal: offer
                });
            });
        }

        peersRef.current[targetSocketId] = peer;
        return peer;
    };

    // VAD Logic
    const checkAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const isSpeakingNow = average > 30 && !isMutedRef.current; // Threshold

        if (isSpeakingNow) {
            if (speakingHoldTimeout.current) {
                clearTimeout(speakingHoldTimeout.current);
                speakingHoldTimeout.current = null;
            }

            if (!lastSpeakingState.current) {
                lastSpeakingState.current = true;
                socket.emit('voice-state-change', { isMuted: isMutedRef.current, isSpeaking: true });
            }
        } else {
            // If we stopped speaking, wait a bit before telling the server
            // This prevents flickering during brief pauses
            if (lastSpeakingState.current && !speakingHoldTimeout.current) {
                speakingHoldTimeout.current = setTimeout(() => {
                    lastSpeakingState.current = false;
                    socket.emit('voice-state-change', { isMuted: isMutedRef.current, isSpeaking: false });
                    speakingHoldTimeout.current = null;
                }, 500); // 500ms hold time
            }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    // Handle Mute State Change
    useEffect(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isMuted;
                // Update server immediately on mute toggle
                socket.emit('voice-state-change', { isMuted, isSpeaking: false });
                // Also reset speaking state locally
                if (isMuted) {
                    lastSpeakingState.current = false;
                    if (speakingHoldTimeout.current) {
                        clearTimeout(speakingHoldTimeout.current);
                        speakingHoldTimeout.current = null;
                    }
                }
            }
        }
    }, [isMuted, socket]);

    // Handle Hand Raise Change
    useEffect(() => {
        socket.emit('raise-hand', { isRaised: isHandRaised });
    }, [isHandRaised, socket]);

    // Push to Talk
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && isMuted) {
                onMuteChange(false);
                setIsPushToTalkActive(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' && isPushToTalkActive) {
                onMuteChange(true);
                setIsPushToTalkActive(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isMuted, isPushToTalkActive, onMuteChange]);

    return null;
}

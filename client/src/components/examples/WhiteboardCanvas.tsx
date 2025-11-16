import WhiteboardCanvas from '../WhiteboardCanvas';

export default function WhiteboardCanvasExample() {
  return (
    <div className="w-full h-screen">
      <WhiteboardCanvas
        onStrokeComplete={(stroke) => console.log('Stroke completed:', stroke)}
        color="#3b82f6"
        brushSize={3}
        tool="pen"
      />
    </div>
  );
}

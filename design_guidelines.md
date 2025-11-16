# Design Guidelines for Real-Time Whiteboard Application

## Design Approach
**User-Specified Theme**: Clean minimal UI with modern aesthetics, focusing on functionality and collaboration

## Visual Theme

### Color Palette
- **Primary**: Pastel blues and greys
- **Background**: White (#FFFFFF)
- **Accents**: Soft pastel tones for tools and UI elements
- **Text**: Dark grey for readability

### Visual Treatment
- **Shadows**: Soft, subtle shadows (`0 4px 12px rgba(0,0,0,0.08)`)
- **Corners**: Rounded corners (8-14px radius)
- **Typography**: Inter, Poppins, or Roboto - clean, modern sans-serif
- **Spacing**: Generous whitespace, lots of breathing room
- **Icons**: Minimal, clean line icons for toolbar

## Layout Structure

### Top Bar
- Logo (left aligned)
- Room Code display (center)
- User count indicator
- Leave button (right aligned)
- Fixed height, spans full width

### Left Toolbar (Vertical)
- Fixed position, full height
- Tools stacked vertically with consistent spacing:
  - Pen tool
  - Brush size slider
  - Color picker
  - Eraser
  - Undo/Redo buttons
  - Shape tools
  - Clear board
  - Templates button
  - Voice toggle
  - Playback button
  - Save button
- Each tool clearly labeled with icon
- Width: ~60-80px

### Center Canvas Area
- Maximum available space
- Full height between top bar and bottom
- White background
- Template layers beneath drawing layer
- Responsive to window resize

### Right Sidebar
- Fixed width (~280-320px)
- Two sections:
  1. **Chat Window** (top 60%)
     - Message list with timestamps
     - Username display per message
     - Auto-scroll to latest
  2. **Participants List** (bottom 40%)
     - User avatars/names
     - Speaking indicators (pulsing animation)
     - Online status

- **Chat Input**: Fixed at bottom of chat section, rounded input with send button

### Popups/Modals
- **Template Selector**:
  - Grid layout of template thumbnails
  - 2-3 columns
  - Template names below thumbnails
  - Centered modal with overlay
  
- **Playback Controls**:
  - Play/Pause button
  - Timeline slider
  - Speed selector dropdown
  - Centered, compact interface

## Component Specifications

### Buttons
- Rounded corners (8px)
- Padding: 8-12px
- Hover state: slight darkening
- Active state: pressed appearance
- Icon + text or icon-only variants

### Input Fields
- Border radius: 8px
- Light border in resting state
- Focus: accent color border
- Padding: 10-14px

### Cards/Panels
- White background
- Soft shadow
- 12px border radius
- 16-24px internal padding

### Tool Icons
- 24x24px or 32x32px size
- Line-weight: 2px
- Consistent stroke width
- Simple, recognizable shapes

## Spacing System
Use Tailwind units: **2, 4, 8, 12, 16, 24** for consistent rhythm
- Component gaps: 8-12px
- Section padding: 16-24px
- Modal margins: 24px minimum from viewport edges

## Typography Hierarchy
- **Room Code/Title**: 18-20px, medium weight
- **Body Text**: 14-16px, regular weight
- **Labels**: 12-14px, medium weight
- **Timestamps**: 11-12px, light weight
- **Line Height**: 1.5 for readability

## Interactive States
- Hover: Subtle background color change
- Active: Slight scale or pressed effect
- Disabled: 50% opacity
- Speaking indicator: Pulsing animation (0.8s cycle)

## Accessibility
- High contrast text/background ratios
- Clear focus indicators
- Keyboard navigation support
- ARIA labels for icon-only buttons

## Performance Considerations
- Canvas throttling for smooth drawing
- Lazy load template images
- Efficient WebSocket event handling
- Minimal animations to reduce CPU load
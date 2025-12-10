# Stream Pause Functionality

## Overview
Added comprehensive pause functionality that allows models to pause their live streams at any time. When paused, viewers cannot leave and must wait for the model to resume the stream. Billing is automatically paused during this time.

## Features Implemented

### 1. API Endpoint
**File:** `src/app/api/streams/[streamId]/pause/route.ts`
- `POST /api/streams/[streamId]/pause` - Toggle pause state
  - Request body: `{ paused: boolean }`
  - Only the model who owns the stream can pause/unpause
  - Updates stream status to `PAUSED` or `LIVE`
- `GET /api/streams/[streamId]/pause` - Check current pause state
  - Returns: `{ paused: boolean, status: string }`

### 2. Model Broadcast Component
**File:** `src/components/stream/model-broadcast.tsx`

#### New Features:
- **Pause/Resume Button**: Prominent pause button in the control bar
  - Yellow color when paused with pulsing animation
  - Shows Play icon when paused, Pause icon when live
  - Prevents other controls from being used while paused
  
- **Status Indicator Updates**:
  - LIVE badge changes to PAUSED badge (yellow) when stream is paused
  - Color coding: Red for LIVE, Yellow for PAUSED
  
- **Pause Overlay**:
  - Full-screen overlay when paused
  - Shows pause icon with animation
  - Large "Resume Stream" button for quick resumption
  - Informs model that viewers are waiting

- **Auto-disable Media**:
  - Camera and microphone automatically disabled when paused
  - Automatically re-enabled when resumed
  - Other controls (mic, camera, screen share) disabled during pause

- **State Checking**:
  - Polls pause state every 5 seconds
  - Ensures consistency across page reloads

### 3. Viewer Player Component
**File:** `src/components/stream/viewer-player.tsx`

#### New Features:
- **Pause Detection**:
  - Polls pause state every 3 seconds
  - Automatically updates UI when model pauses/resumes

- **Pause Overlay for Viewers**:
  - Full-screen overlay with clock icon
  - Clear message: "Stream Paused"
  - Informs viewers that the model will resume shortly
  - Yellow theme matching the model's pause UI
  - Prevents viewer from leaving by keeping them engaged

- **Status Updates**:
  - LIVE indicator changes to PAUSED (yellow) in top bar
  - Pulsing animation stops when paused

- **Billing Pause**:
  - Token billing automatically stops when stream is paused
  - No charges to viewers during pause
  - Resumes automatically when stream resumes

## Database Schema
The Stream model already had support for PAUSED status:
```prisma
enum StreamStatus {
  SCHEDULED
  LIVE
  PAUSED  // ← Already existed
  ENDED
}
```

## User Experience Flow

### Model's Experience:
1. **During Live Stream**: 
   - Model sees pause button in control bar
   - Can click pause at any time

2. **When Paused**:
   - Camera and mic automatically turn off
   - Full overlay appears with "Stream Paused" message
   - LIVE badge changes to PAUSED (yellow)
   - Large "Resume Stream" button prominently displayed
   - Other controls disabled

3. **Resuming**:
   - Click "Resume Stream" button or pause button
   - Camera and mic automatically re-enable
   - Stream returns to LIVE status
   - Viewers immediately see the resumed stream

### Viewer's Experience:
1. **During Live Stream**:
   - Normal viewing experience
   - Being charged tokens per minute

2. **When Model Pauses**:
   - Full overlay appears within 3 seconds
   - Clock icon with "Stream Paused" message
   - "Please wait, the stream will resume shortly..."
   - Cannot leave or close the overlay
   - Billing automatically stops
   - LIVE indicator changes to PAUSED

3. **When Model Resumes**:
   - Overlay disappears automatically
   - Stream continues seamlessly
   - Billing resumes automatically
   - PAUSED indicator changes back to LIVE

## Technical Details

### State Management:
- Model component: `isPaused` state
- Viewer component: `isPaused` state
- Both poll the API for real-time updates

### Polling Intervals:
- Model: Every 5 seconds
- Viewer: Every 3 seconds (more frequent for better UX)

### UI Disabled During Pause:
- Camera toggle
- Microphone toggle
- Screen share toggle

### Automatic Actions:
- **On Pause**: Disable camera and microphone
- **On Resume**: Re-enable camera and microphone
- **Billing**: Stop/resume automatically

## Benefits

1. **For Models**:
   - Take breaks without ending stream
   - Maintain viewer engagement
   - Keep room active and viewers waiting
   - Professional pause experience

2. **For Viewers**:
   - Clear communication about pause state
   - No charges during pause
   - Automatic resume when model returns
   - Cannot accidentally leave during pause

3. **For Platform**:
   - Fair billing (no charging during pause)
   - Better user experience
   - Reduced stream abandonment
   - Professional feature set

## Testing Checklist

- [ ] Model can pause stream
- [ ] Model can resume stream
- [ ] Pause button changes appearance
- [ ] LIVE/PAUSED badge updates correctly
- [ ] Camera/mic disable on pause
- [ ] Camera/mic re-enable on resume
- [ ] Viewer sees pause overlay within 3 seconds
- [ ] Viewer cannot leave during pause
- [ ] Billing stops during pause
- [ ] Billing resumes after unpause
- [ ] Multiple pause/resume cycles work correctly
- [ ] Pause state persists across page reloads

## Future Enhancements

1. **Pause Timer**: Show how long stream has been paused
2. **Auto-resume Timer**: Automatically resume after X minutes
3. **Pause Reason**: Model can provide a reason for pause
4. **Estimated Return Time**: Model can set expected return time
5. **Pause Limit**: Maximum pause duration (e.g., 10 minutes)
6. **Pause Analytics**: Track pause frequency and duration
7. **Notification**: Push notification when stream resumes

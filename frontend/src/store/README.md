# Redux Toolkit (RTK) Setup

This directory contains the Redux Toolkit setup for the travel planner application.

## Structure

```
src/store/
├── index.ts          # Main store configuration
├── slices/           # Redux slices
│   ├── authSlice.ts  # Authentication state management
│   └── travelSlice.ts # Travel/trips state management
└── README.md         # This documentation
```

## Store Configuration

The main store is configured in `src/store/index.ts` with:
- Type-safe hooks (`useAppDispatch`, `useAppSelector`)
- Middleware configuration
- Slice imports and registration

## Available Slices

### Auth Slice (`authSlice.ts`)
Manages authentication state including:
- User information
- Authentication status
- Loading states
- Error handling

**Actions:**
- `loginStart()` - Start login process
- `loginSuccess(user)` - Login successful
- `loginFailure(error)` - Login failed
- `logout()` - Logout user
- `clearError()` - Clear error state

### Travel Slice (`travelSlice.ts`)
Manages travel/trips state including:
- List of trips
- Current selected trip
- Loading states
- Error handling

**Actions:**
- `addTrip(trip)` - Add new trip
- `updateTrip(trip)` - Update existing trip
- `deleteTrip(id)` - Delete trip
- `setCurrentTrip(trip)` - Set current trip
- `toggleTripCompletion(id)` - Toggle trip completion
- `clearTrips()` - Clear all trips
- `setLoading(boolean)` - Set loading state
- `setError(error)` - Set error state

## Usage

### In Components

```tsx
import { useAppDispatch, useAppSelector } from '../store'
import { addTrip } from '../store/slices/travelSlice'

const MyComponent = () => {
  const dispatch = useAppDispatch()
  const { trips, isLoading } = useAppSelector((state) => state.travel)
  
  const handleAddTrip = (tripData) => {
    dispatch(addTrip(tripData))
  }
  
  return (
    // Your component JSX
  )
}
```

### Type Safety

The store provides type-safe hooks:
- `useAppDispatch()` - Typed dispatch function
- `useAppSelector()` - Typed selector hook

### State Structure

```typescript
interface RootState {
  auth: {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  travel: {
    trips: Trip[]
    currentTrip: Trip | null
    isLoading: boolean
    error: string | null
  }
}
```

## Adding New Slices

1. Create a new slice file in `src/store/slices/`
2. Define the slice with `createSlice`
3. Export actions and reducer
4. Import and add to the store in `src/store/index.ts`

Example:
```typescript
// src/store/slices/newSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const newSlice = createSlice({
  name: 'new',
  initialState: {},
  reducers: {
    // Your reducers
  }
})

export const { actions } = newSlice.actions
export default newSlice.reducer
```

Then add to store:
```typescript
// src/store/index.ts
import newSlice from './slices/newSlice'

export const store = configureStore({
  reducer: {
    // ... other slices
    new: newSlice,
  },
})
``` 
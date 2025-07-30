import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  description?: string
  isCompleted: boolean
}

interface TravelState {
  trips: Trip[]
  currentTrip: Trip | null
  isLoading: boolean
  error: string | null
}

const initialState: TravelState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
}

const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.trips.push(action.payload)
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id)
      if (index !== -1) {
        state.trips[index] = action.payload
      }
    },
    deleteTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter(trip => trip.id !== action.payload)
    },
    setCurrentTrip: (state, action: PayloadAction<Trip | null>) => {
      state.currentTrip = action.payload
    },
    toggleTripCompletion: (state, action: PayloadAction<string>) => {
      const trip = state.trips.find(t => t.id === action.payload)
      if (trip) {
        trip.isCompleted = !trip.isCompleted
      }
    },
    clearTrips: (state) => {
      state.trips = []
      state.currentTrip = null
    },
  },
})

export const {
  setLoading,
  setError,
  addTrip,
  updateTrip,
  deleteTrip,
  setCurrentTrip,
  toggleTripCompletion,
  clearTrips,
} = travelSlice.actions

export default travelSlice.reducer 
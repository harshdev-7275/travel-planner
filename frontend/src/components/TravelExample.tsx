import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { addTrip, deleteTrip, toggleTripCompletion } from '../store/slices/travelSlice'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

const TravelExample = () => {
  const dispatch = useAppDispatch()
  const { trips, isLoading, error } = useAppSelector((state) => state.travel)
  
  const [newTrip, setNewTrip] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  const handleAddTrip = () => {
    if (newTrip.title && newTrip.destination && newTrip.startDate && newTrip.endDate) {
      const trip = {
        id: Date.now().toString(),
        ...newTrip,
        isCompleted: false,
      }
      dispatch(addTrip(trip))
      setNewTrip({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        description: '',
      })
    }
  }

  const handleDeleteTrip = (id: string) => {
    dispatch(deleteTrip(id))
  }

  const handleToggleCompletion = (id: string) => {
    dispatch(toggleTripCompletion(id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Travel Planner</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Trip Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Trip Title</Label>
              <Input
                id="title"
                value={newTrip.title}
                onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                placeholder="Enter trip title"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={newTrip.destination}
                onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                placeholder="Enter destination"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newTrip.startDate}
                onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newTrip.endDate}
                onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={newTrip.description}
              onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
              placeholder="Enter trip description"
            />
          </div>
          <Button onClick={handleAddTrip} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Trip'}
          </Button>
        </CardContent>
      </Card>

      {/* Trips List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Trips ({trips.length})</h2>
        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No trips added yet. Add your first trip above!
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} className={trip.isCompleted ? 'opacity-75' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold ${trip.isCompleted ? 'line-through' : ''}`}>
                      {trip.title}
                    </h3>
                    <p className="text-gray-600">📍 {trip.destination}</p>
                    <p className="text-sm text-gray-500">
                      📅 {trip.startDate} - {trip.endDate}
                    </p>
                    {trip.description && (
                      <p className="text-gray-600 mt-2">{trip.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCompletion(trip.id)}
                    >
                      {trip.isCompleted ? 'Undo' : 'Complete'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default TravelExample 
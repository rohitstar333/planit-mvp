import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState({
    title: '', date: '', time: '', category: 'Adventure', estimatedCost: '', notes: ''
  });

  // Join Trip State
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  // Fetch trips when logged in
  useEffect(() => {
    if (token) {
      fetch(`${API}/trip`, { headers: { Authorization: token } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTrips(data);
        });
    }
  }, [token]);

  // Fetch activities when a trip is selected
  useEffect(() => {
    if (selectedTrip) {
      fetch(`${API}/trip/${selectedTrip}/activity`, {
        headers: { Authorization: token }
      })
        .then(res => res.json())
        .then(setActivities);
    }
  }, [selectedTrip, token]);

  // Register user
  const register = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      setView('login');
      setError('Registered! Please log in.');
    } else {
      const data = await res.json();
      setError(data.msg || 'Registration failed');
    }
  };

  // Login user
  const login = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setView('dashboard');
      setError('');
    } else {
      setError(data.msg || 'Login failed');
    }
  };

  // Create a new trip
  const createTrip = async () => {
    setError('');
    if (!tripName || !startDate || !endDate) {
      setError('Please fill all trip details');
      return;
    }
    const res = await fetch(`${API}/trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ name: tripName, startDate, endDate, budget })
    });
    if (res.ok) {
      setTripName('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      // Refresh trips
      fetch(`${API}/trip`, { headers: { Authorization: token } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTrips(data);
        });
    } else {
      setError('Trip creation failed');
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setTrips([]);
    setView('login');
    setEmail('');
    setPassword('');
    setError('');
    setSelectedTrip(null);
    setActivities([]);
  };

  // Add activity
  const addActivity = async () => {
    if (!activityForm.title || !activityForm.date) {
      setError('Please fill activity title and date');
      return;
    }
    const res = await fetch(`${API}/trip/${selectedTrip}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(activityForm)
    });
    if (res.ok) {
      setActivityForm({ title: '', date: '', time: '', category: 'Adventure', estimatedCost: '', notes: '' });
      // Refresh activities
      fetch(`${API}/trip/${selectedTrip}/activity`, {
        headers: { Authorization: token }
      })
        .then(res => res.json())
        .then(setActivities);
    }
  };

  // Voting function (robust for multi-user, always shows a number)
  const voteActivity = async (index) => {
    const res = await fetch(`${API}/trip/${selectedTrip}/activity/${index}/vote`, {
      method: 'POST',
      headers: { Authorization: token }
    });
    const updatedActivity = await res.json();
    setActivities(prev =>
      prev.map((a, i) => (i === index ? updatedActivity : a))
    );
  };

  // Join Trip by Code
  const joinTrip = async () => {
    setJoinMsg('');
    const res = await fetch(`${API}/trip/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ code: joinCode })
    });
    const data = await res.json();
    if (res.ok) {
      setJoinMsg('Joined trip!');
      setJoinCode('');
      // Refresh trips
      fetch(`${API}/trip`, { headers: { Authorization: token } })
        .then(res => res.json())
        .then(setTrips);
    } else {
      setJoinMsg(data.msg || 'Could not join trip');
    }
  };

  // Login/Register Card
  if (!token) {
    return (
      <div className="main-card">
        <h2>{view === 'login' ? 'Login' : 'Register'}</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="button-row">
          {view === 'login' ? (
            <>
              <button onClick={login}>Login</button>
              <button onClick={() => { setView('register'); setError(''); }}>Go to Register</button>
            </>
          ) : (
            <>
              <button onClick={register}>Register</button>
              <button onClick={() => { setView('login'); setError(''); }}>Go to Login</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Card
  return (
    <div className="main-card">
      <h2>Welcome to Planit!</h2>
      <div className="button-row">
        <button onClick={logout}>Logout</button>
      </div>
      <h3>Create Trip</h3>
      {error && <div className="error-message">{error}</div>}
      <input
        placeholder="Trip Name"
        value={tripName}
        onChange={e => setTripName(e.target.value)}
      />
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      />
      <input
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
      />
      <input
        placeholder="Budget (optional)"
        type="number"
        value={budget}
        onChange={e => setBudget(e.target.value)}
      />
      <div className="button-row">
        <button onClick={createTrip}>Create</button>
      </div>

      {/* --- JOIN TRIP SECTION --- */}
      <h3>Join a Trip</h3>
      <input
        placeholder="Paste Trip Code"
        value={joinCode}
        onChange={e => setJoinCode(e.target.value)}
      />
      <div className="button-row">
        <button onClick={joinTrip}>Join Trip</button>
      </div>
      {joinMsg && <div>{joinMsg}</div>}

      <h3>Your Trips</h3>
      {trips.length === 0 && <div>No trips yet. Create your first trip!</div>}
      <ul>
        {trips.map(trip => (
          <li key={trip._id}>
            <b>{trip.name}</b> ({trip.startDate} to {trip.endDate})
            {trip.budget && <> — Budget: ₹{trip.budget}</>}
            <div className="button-row">
              <button onClick={() => setSelectedTrip(trip._id)}>View Activities</button>
            </div>
            {selectedTrip === trip._id && (
              <div style={{ border: '1.5px solid #b6c1e3', background: '#f6f8ff', borderRadius: 8, marginTop: 16, padding: 14, width: '100%' }}>
                <div className="add-activity-form">
                  <h4>Add Activity</h4>
                  <input placeholder="Title" value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} />
                  <input type="date" value={activityForm.date} onChange={e => setActivityForm({ ...activityForm, date: e.target.value })} />
                  <input type="time" value={activityForm.time} onChange={e => setActivityForm({ ...activityForm, time: e.target.value })} />
                  <select value={activityForm.category} onChange={e => setActivityForm({ ...activityForm, category: e.target.value })}>
                    <option>Adventure</option>
                    <option>Food</option>
                    <option>Sightseeing</option>
                    <option>Other</option>
                  </select>
                  <input placeholder="Estimated Cost" type="number" value={activityForm.estimatedCost} onChange={e => setActivityForm({ ...activityForm, estimatedCost: e.target.value })} />
                  <input placeholder="Notes" value={activityForm.notes} onChange={e => setActivityForm({ ...activityForm, notes: e.target.value })} />
                  <button onClick={addActivity}>Add</button>
                </div>
                <h4>Activities</h4>
                <ul>
                  {activities.map((a, i) => (
                    <li key={i}>
                      <b>{a.title}</b> ({a.category}) {a.date} {a.time} — ₹{a.estimatedCost} {a.notes && <span>- {a.notes}</span>}
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => voteActivity(i)}
                        >
                          {/* Always show a number for votes */}
                          Vote ({Array.isArray(a.votes) ? a.votes.length : 0})
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p>
                  <b>
                    Total Estimated Cost: ₹
                    {activities.reduce((sum, a) => sum + (Number(a.estimatedCost) || 0), 0)}
                  </b>
                </p>
                <p>Trip Code: <code>{selectedTrip}</code> (Share this with friends!)</p>
                <div className="button-row">
                  <button onClick={() => { setSelectedTrip(null); setActivities([]); }}>Close</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

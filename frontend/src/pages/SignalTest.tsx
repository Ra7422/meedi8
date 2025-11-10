import React, { useState } from 'react';
import ButtonPanel from '../components/ButtonPanel';

export default function SignalTest() {
  const [roomId, setRoomId] = useState('');
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Signal Test</h1>
      <label className="block">
        <span className="text-sm">Room ID</span>
        <input
          className="border rounded px-3 py-2 w-64 block"
          value={roomId}
          onChange={(e)=>setRoomId(e.target.value)}
          placeholder="e.g. 42"
        />
      </label>
      {roomId ? (
        <div className="border rounded p-3">
          <ButtonPanel roomId={roomId} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">Enter a room id to enable buttons.</p>
      )}
    </div>
  );
}

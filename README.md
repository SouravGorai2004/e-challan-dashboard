# E-Challan Management & Manual Verification Dashboard

React + Vite + plain CSS, React Router, Lucide icons, Recharts.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
```

## Add your CCTV video

Copy your footage to `public/videos/cctv-evidence.mp4` (or change `VIDEO_SRC` in `src/data/config.js`).
Until the file exists, the player shows a "video file not found" message. The same footage is
shown for every demo case. Frame stepping assumes 25 fps (`FPS` in `VideoPlayer.jsx`).

## Structure

```
src/
  components/  common/ (Modal, ConfirmDialog, Toast, ui, ChallanDocument)
               layout/ (Sidebar + shell)   verification/ (VideoPlayer, panels)
  pages/       one file per sidebar module
  services/    api.js (mock + REST implementations), httpClient.js, mockDb.js
  context/     AppContext.jsx (state + workflow actions)
  utils/       fineCalculator.js (pure logic), format.js
  data/        config.js (video path, API URL, demo penalty rules), mockData.js
```

## Connecting the Spring Boot backend

1. Set `USE_MOCK_API = false` in `src/data/config.js` and `VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`).
2. Implement the endpoints listed in the `rest` object in `src/services/api.js`.
3. Add the auth token handling in `httpClient.js`.

## Notes

- All vehicle, owner, camera, complaint and challan data is mock data.
- Fine amounts are **demo placeholders**, editable in Settings; they are not official penalties.
- Data resets on page refresh (in-memory mock database).

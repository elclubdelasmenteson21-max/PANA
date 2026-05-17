try {
  require('./backend/server/dist/index');
} catch (e) {
  console.error('Server not built yet. Run: cd backend/server && npm install && npx tsc');
  process.exit(1);
}

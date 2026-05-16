const { insertProject, getProjects } = require('./db');

const PROJECTS = [
  { id: 'proj-agadir', name: 'Agadir Logistics' },
  { id: 'proj-paris', name: 'Paris Expansion' },
  { id: 'proj-benelux', name: 'Benelux Sales' },
];

async function seed() {
  const existing = await getProjects();
  if (existing.length > 0) return;
  console.log('Seeding database…');
  for (const p of PROJECTS) await insertProject(p.id, p.name);
  console.log('Seed complete. Use the admin panel to generate invite links for contacts.');
}

module.exports = { seed };

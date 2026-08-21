const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

const startTestServer = async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, port };
};

test('GET /api/catalog returns catalog items', async () => {
  const { server, port } = await startTestServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/catalog`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(data.items));
    assert.equal(data.count, data.items.length);
  } finally {
    server.close();
  }
});

test('PUT /api/products/:id updates an existing product', async () => {
  const { server, port } = await startTestServer();

  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Produto teste',
        artist: 'Artista teste',
        price: 50,
        image: 'https://example.com/image.jpg',
        tracks: [{ title: 'Intro', duration: '3:00', url: 'https://example.com/song.mp3' }]
      })
    });

    const created = await createResponse.json();
    const productId = created.product.id;

    const updateResponse = await fetch(`http://127.0.0.1:${port}/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Produto atualizado',
        artist: 'Artista atualizado',
        price: 75,
        image: 'https://example.com/novo.jpg',
        tracks: [{ title: 'Novo tema', duration: '4:00', url: 'https://example.com/novo.mp3' }]
      })
    });

    const updated = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updated.product.title, 'Produto atualizado');
    assert.equal(updated.product.artist, 'Artista atualizado');
  } finally {
    server.close();
  }
});

test('DELETE /api/products/:id removes an existing product', async () => {
  const { server, port } = await startTestServer();

  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Produto para remover',
        artist: 'Artista para remover',
        price: 20,
        image: 'https://example.com/remover.jpg',
        tracks: [{ title: 'Remover', duration: '2:00', url: 'https://example.com/remover.mp3' }]
      })
    });

    const created = await createResponse.json();
    const productId = created.product.id;

    const deleteResponse = await fetch(`http://127.0.0.1:${port}/api/products/${productId}`, {
      method: 'DELETE'
    });

    const deleted = await deleteResponse.json();

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleted.removed, true);
    assert.equal(deleted.id, productId);
  } finally {
    server.close();
  }
});

test('POST /api/products stores a publish flag and filters catalog by published status', async () => {
  const { server, port } = await startTestServer();

  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Produto em rascunho',
        artist: 'Artista em rascunho',
        price: 42,
        image: 'https://example.com/rascunho.jpg',
        published: false,
        tracks: [{ title: 'Rascunho', duration: '2:30', url: 'https://example.com/rascunho.mp3' }]
      })
    });

    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(created.product.published, false);

    const catalogResponse = await fetch(`http://127.0.0.1:${port}/api/catalog`);
    const catalog = await catalogResponse.json();
    const item = catalog.items.find((product) => product.id === created.product.id);

    assert.equal(catalogResponse.status, 200);
    assert.equal(item?.published, false);
  } finally {
    server.close();
  }
});

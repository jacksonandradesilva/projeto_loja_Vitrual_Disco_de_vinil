const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let catalog = [
  {
    id: 1,
    title: 'Midnight Echoes',
    artist: 'Nova Skyline',
    price: 89.9,
    oldPrice: 119.9,
    year: 2024,
    genre: 'Eletrônica',
    stock: 12,
    description: 'Um disco com ondas sintéticas, batidas profundas e melodias emocionantes.',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    accent: '#6d5efc',
    tracks: [
      { title: 'Dawn Lights', duration: '3:42', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { title: 'Afterglow', duration: '4:05', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { title: 'Velvet Hours', duration: '3:58', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ]
  },
  {
    id: 2,
    title: 'Golden Static',
    artist: 'The Blue Rooms',
    price: 95.0,
    oldPrice: 129.9,
    year: 2023,
    genre: 'Rock',
    stock: 8,
    description: 'Misturas de rock clássico e pop moderno com timbre quente e apaixonante.',
    image:
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=900&q=80',
    accent: '#f97316',
    tracks: [
      { title: 'Neon Avenue', duration: '4:18', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { title: 'Paper Stars', duration: '3:49', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { title: 'Glass Horizon', duration: '4:22', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
    ]
  },
  {
    id: 3,
    title: 'Sunset Circuit',
    artist: 'Luna Harbor',
    price: 99.9,
    oldPrice: 139.9,
    year: 2022,
    genre: 'Pop',
    stock: 15,
    description: 'Faixas com energia tropical, elegância e um clima perfeito para tardes longas.',
    image:
      'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=900&q=80',
    accent: '#ec4899',
    tracks: [
      { title: 'Night Ferry', duration: '3:33', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
      { title: 'Warm Lights', duration: '4:07', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
      { title: 'Coastal Drift', duration: '3:59', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
    ]
  },
  {
    id: 4,
    title: 'Velvet Avenue',
    artist: 'Solis Drift',
    price: 110.5,
    oldPrice: 149.9,
    year: 2021,
    genre: 'Jazz',
    stock: 6,
    description: 'Jazz suave e atmosférico, perfeito para noites com uma atmosfera íntima e elegante.',
    image:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    accent: '#14b8a6',
    tracks: [
      { title: 'Late Trains', duration: '4:01', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
      { title: 'Blue Notes', duration: '5:11', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
      { title: 'Rooftop Echo', duration: '4:46', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
    ]
  },
  {
    id: 5,
    title: 'Black Canvas',
    artist: 'Monarch Flame',
    price: 120.0,
    oldPrice: 160.0,
    year: 2020,
    genre: 'Indie',
    stock: 11,
    description: 'Trilhas íntimas e atmosfera cinematográfica para um som envolvente e memorável.',
    image:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    accent: '#f59e0b',
    tracks: [
      { title: 'Harbor Glow', duration: '4:24', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
      { title: 'Last Frame', duration: '3:44', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
      { title: 'Static Rose', duration: '4:18', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' }
    ]
  },
  {
    id: 6,
    title: 'Clear Signal',
    artist: 'Mercury Bone',
    price: 84.9,
    oldPrice: 109.9,
    year: 2024,
    genre: 'Synthwave',
    stock: 17,
    description: 'Uma coleção moderna de synthwave com brilho, groove e nostalgia futurista.',
    image:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
    accent: '#22c55e',
    tracks: [
      { title: 'Night Pulse', duration: '4:08', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
      { title: 'Signal Bloom', duration: '3:56', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3' },
      { title: 'Nocturne Run', duration: '4:32', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3' }
    ]
  }
];

app.get('/api/catalog', (req, res) => {
  res.json({ items: catalog, count: catalog.length });
});

app.post('/api/products', (req, res) => {
  const {
    title,
    artist,
    price,
    oldPrice,
    year,
    genre,
    stock,
    description,
    image,
    accent,
    tracks
  } = req.body;

  if (!title || !artist || !price || !image) {
    return res.status(400).json({ message: 'Preencha título, artista, preço e imagem.' });
  }

  const parsedTracks = Array.isArray(tracks) && tracks.length > 0
    ? tracks
        .map((track, index) => ({
          title: String(track.title || `Faixa ${index + 1}`).trim(),
          duration: String(track.duration || '3:30'),
          url: String(track.url || '').trim()
        }))
        .filter((track) => track.title && track.url)
    : [{ title: 'Preview', duration: '3:30', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }];

  const newProduct = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: String(title).trim(),
    artist: String(artist).trim(),
    price: Number(price),
    oldPrice: Number(oldPrice || price),
    year: Number(year || new Date().getFullYear()),
    genre: String(genre || 'Diversos').trim(),
    stock: Number(stock || 1),
    description: String(description || 'Produto cadastrado no painel administrativo.').trim(),
    image: String(image).trim(),
    accent: String(accent || '#f97316'),
    tracks: parsedTracks
  };

  catalog = [...catalog, newProduct];

  res.status(201).json({
    success: true,
    message: 'Produto cadastrado com sucesso!',
    product: newProduct,
    count: catalog.length
  });
});

app.post('/api/checkout', (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Carrinho vazio.' });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.json({
    success: true,
    message: 'Pedido confirmado com sucesso!',
    total: Number(total.toFixed(2)),
    items
  });
});

app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor da loja rodando em http://localhost:${PORT}`);
});

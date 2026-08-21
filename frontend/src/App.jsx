import { useEffect, useMemo, useRef, useState } from 'react';

const API_URL = '/api/catalog';
const CATALOG_KEY = 'the-roots-catalog';
const CART_KEY = 'the-roots-cart';
const FALLBACK_TRACK_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const filters = ['Todos', 'Eletrônica', 'Rock', 'Pop', 'Jazz', 'Indie', 'Synthwave'];

const defaultForm = {
  title: '',
  artist: '',
  genre: 'Eletrônica',
  year: new Date().getFullYear(),
  price: '',
  oldPrice: '',
  stock: 1,
  description: '',
  image: '',
  accent: '#f97316',
  featured: false,
  tracksText: 'Dawn Lights|3:42|https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\nAfterglow|4:05|https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
};

function App() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CATALOG_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [activeTrack, setActiveTrack] = useState(null);
  const [view, setView] = useState('store');
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef(null);

  const persistCatalog = (catalogList) => {
    setItems(catalogList);
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalogList));
  };

  const loadCatalog = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const catalog = data.items || [];
      persistCatalog(catalog);
      if (catalog.length > 0) {
        setSelectedId(catalog[0].id);
      }
    } catch (error) {
      const savedCatalog = localStorage.getItem(CATALOG_KEY);
      if (savedCatalog) {
        try {
          const parsedCatalog = JSON.parse(savedCatalog);
          persistCatalog(parsedCatalog);
          if (parsedCatalog.length > 0) {
            setSelectedId(parsedCatalog[0].id);
          }
        } catch {
          persistCatalog([]);
        }
      }
      setMessage('Não foi possível carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((album) => {
      const isPublished = album.published !== false;
      const matchesFilter = selectedFilter === 'Todos' || album.genre === selectedFilter;
      const matchesSearch =
        album.title.toLowerCase().includes(search.toLowerCase()) ||
        album.artist.toLowerCase().includes(search.toLowerCase());

      return isPublished && matchesFilter && matchesSearch;
    });
  }, [items, search, selectedFilter]);

  useEffect(() => {
    if (!filteredItems.length && items.length > 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId && filteredItems[0]) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, items, selectedId]);

  const selectedAlbum = useMemo(
    () => filteredItems.find((album) => album.id === selectedId) || filteredItems[0] || items.find((album) => album.id === selectedId) || items[0],
    [filteredItems, items, selectedId]
  );

  useEffect(() => {
    if (!selectedAlbum) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack && selectedAlbum.tracks.some((track) => track.title === activeTrack.title)) {
      audio.src = activeTrack.url;
      audio.load();
      return;
    }

    audio.pause();
    audio.src = selectedAlbum.tracks[0]?.url || '';
    audio.load();
  }, [selectedAlbum, activeTrack]);

  const highlightedItems = filteredItems.filter((album) => album.featured);
  const featuredProducts = highlightedItems.length > 0 ? highlightedItems.slice(0, 4) : filteredItems.slice(0, 4);
  const promoProducts = highlightedItems.length > 0 ? highlightedItems.slice(0, 3) : filteredItems.slice(0, 3);

  const addToCart = (album) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === album.id);
      if (existing) {
        return current.map((item) =>
          item.id === album.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...album, quantity: 1 }];
    });

    setMessage(`${album.title} adicionado ao carrinho.`);
  };

  const updateQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) {
      setMessage('Seu carrinho está vazio.');
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao finalizar pedido');
      setMessage(`${data.message} Total: R$ ${data.total.toFixed(2)}`);
      setCart([]);
    } catch (error) {
      setMessage(error.message || 'Erro ao finalizar pedido.');
    }
  };

  const normalizeTrackUrl = (url) => {
    if (typeof url !== 'string') return FALLBACK_TRACK_URL;
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : FALLBACK_TRACK_URL;
  };

  const handleTrackPlay = async (track) => {
    if (!track || !audioRef.current) return;

    const safeUrl = normalizeTrackUrl(track.url);
    setActiveTrack({ ...track, url: safeUrl });
    audioRef.current.src = safeUrl;
    audioRef.current.load();

    try {
      await audioRef.current.play();
    } catch (error) {
      setMessage('Não foi possível reproduzir essa faixa. Tente outra música ou verifique a URL do áudio.');
    }
  };

  const openProductDetail = (product) => {
    if (!product) return;
    setSelectedId(product.id);
    setView('product');
  };

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const parseTracks = (text) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((entry) => {
        const [title, duration, url] = entry.split('|').map((item) => item.trim());
        return { title, duration: duration || '3:30', url: normalizeTrackUrl(url) };
      })
      .filter((track) => track.title && track.url);
  };

  const formatTracksText = (tracks = []) => {
    return tracks
      .map((track) => `${track.title}|${track.duration || '3:30'}|${track.url || ''}`)
      .join('\n');
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      artist: product.artist,
      genre: product.genre,
      year: product.year || new Date().getFullYear(),
      price: String(product.price),
      oldPrice: String(product.oldPrice || product.price),
      stock: product.stock || 1,
      description: product.description || '',
      image: product.image || '',
      accent: product.accent || '#f97316',
      featured: Boolean(product.featured),
      tracksText: formatTracksText(product.tracks || [])
    });
    setView('admin');
    setMessage(`Editando ${product.title}.`);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Deseja remover este produto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao remover produto.');

      const nextCatalog = items.filter((item) => item.id !== productId);
      persistCatalog(nextCatalog);
      if (selectedId === productId) {
        setSelectedId(nextCatalog[0]?.id || null);
      }
      if (editingId === productId) {
        setEditingId(null);
        setForm(defaultForm);
      }
      setMessage(data.message || 'Produto removido com sucesso!');
    } catch (error) {
      setMessage(error.message || 'Erro ao remover produto.');
    }
  };

  const handleTogglePublish = async (product) => {
    const nextPublished = !Boolean(product.published);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          published: nextPublished
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao atualizar publicação.');

      const nextCatalog = items.map((item) =>
        item.id === product.id ? { ...item, published: nextPublished } : item
      );

      persistCatalog(nextCatalog);
      setMessage(data.message || (nextPublished ? 'Produto publicado na loja.' : 'Produto ocultado da loja.'));
    } catch (error) {
      setMessage(error.message || 'Erro ao atualizar publicação.');
    }
  };

  const handleToggleFeatured = async (product) => {
    const nextFeatured = !Boolean(product.featured);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          featured: nextFeatured
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao atualizar destaque.');

      const nextCatalog = items.map((item) =>
        item.id === product.id ? { ...item, featured: nextFeatured } : item
      );

      persistCatalog(nextCatalog);
      setMessage(data.message || (nextFeatured ? 'Produto adicionado aos destaques.' : 'Produto removido dos destaques.'));
    } catch (error) {
      setMessage(error.message || 'Erro ao atualizar destaque.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const tracks = parseTracks(form.tracksText);

    if (!form.title || !form.artist || !form.price || !form.image || tracks.length === 0) {
      setMessage('Preencha título, artista, preço, imagem e pelo menos uma faixa de áudio.');
      return;
    }

    try {
      setSubmitting(true);
      const existingProduct = editingId ? items.find((item) => item.id === editingId) : null;
      const requestBody = {
        title: form.title,
        artist: form.artist,
        genre: form.genre,
        year: Number(form.year || new Date().getFullYear()),
        price: Number(form.price),
        oldPrice: Number(form.oldPrice || form.price),
        stock: Number(form.stock || 1),
        description: form.description,
        image: form.image,
        accent: form.accent,
        published: editingId ? Boolean(existingProduct?.published) : false,
        featured: Boolean(form.featured),
        tracks
      };

      const response = await fetch(editingId ? `/api/products/${editingId}` : '/api/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao salvar produto.');

      const updatedProduct = data.product;
      const nextCatalog = editingId
        ? items.map((item) => (item.id === updatedProduct.id ? updatedProduct : item))
        : [...items, updatedProduct];

      persistCatalog(nextCatalog);
      setSelectedId(updatedProduct?.id || items[0]?.id);
      setMessage(data.message || 'Produto salvo com sucesso!');
      setForm(defaultForm);
      setEditingId(null);
      setView('store');
      await loadCatalog();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const sloganImage = '/assets/slogan/the-roots.jpg';

  return (
    <div className="store-shell">
      <header className="site-header">
        <div className="topbar-strip">
          <div className="topbar-left">
            <span>85987881500</span>
            <a href="mailto:contatoce@yahoo.com.br">contatoce@yahoo.com.br</a>
          </div>
          <div className="topbar-right">
            <button type="button" className={view === 'store' ? 'view-button active' : 'view-button'} onClick={() => setView('store')}>Loja</button>
            <button type="button" className={view === 'catalog' ? 'view-button active' : 'view-button'} onClick={() => setView('catalog')}>Produtos</button>
            <button type="button" className={view === 'admin' ? 'view-button active' : 'view-button'} onClick={() => setView('admin')}>Administração</button>
          </div>
        </div>

        <div className="main-header">
          <div className="brand-box">
            <div className="logo-mark">
              <img src={sloganImage} alt="The Roots logo" />
            </div>
            <div>
              <span className="brand-name">The Roots</span>
              <small>vinil & cultura</small>
            </div>
          </div>

          {view === 'store' && (
            <>
              <nav className="main-nav" aria-label="menu principal">
                <button type="button" className="nav-link-button" onClick={() => setView('store')}>Início</button>
                <button type="button" className="nav-link-button" onClick={() => setView('catalog')}>Produtos</button>
                <button type="button" className="nav-link-button" onClick={() => setView('catalog')}>Contato</button>
                <button type="button" className="nav-link-button" onClick={() => setView('catalog')}>Política de Privacidade</button>
              </nav>

              <div className="tools-box">
                <div className="search-box">
                  <input type="text" placeholder="Barra de pesquisa" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <button type="button">Buscar</button>
                </div>
                <button type="button" className="cart-summary">
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  <strong>R$ {total.toFixed(2)}</strong>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {view === 'product' ? (
        <main className="product-detail-page">
          <button type="button" className="secondary-button product-back-button" onClick={() => setView('store')}>
            Voltar à loja
          </button>

          {selectedAlbum && (
            <section className="product-detail-card">
              <div className="product-detail-image-wrap">
                <img src={selectedAlbum.image} alt={selectedAlbum.title} className="product-detail-image" />
              </div>

              <div className="product-detail-info">
                <p className="eyebrow">{selectedAlbum.genre}</p>
                <h2>{selectedAlbum.title}</h2>
                <p className="product-detail-artist">{selectedAlbum.artist}</p>

                <div className="product-detail-price-block">
                  <span className="old-price">R$ {selectedAlbum.oldPrice.toFixed(2)}</span>
                  <strong>R$ {selectedAlbum.price.toFixed(2)}</strong>
                  <span className="discount">{Math.round(((selectedAlbum.oldPrice - selectedAlbum.price) / selectedAlbum.oldPrice) * 100)}% OFF</span>
                </div>

                <p className="product-detail-description">{selectedAlbum.description}</p>

                <div className="product-detail-meta">
                  <span>Ano: {selectedAlbum.year}</span>
                  <span>Estoque: {selectedAlbum.stock}</span>
                </div>

                <div className="product-detail-actions">
                  <button type="button" className="buy-button" onClick={() => addToCart(selectedAlbum)}>
                    Adicionar ao carrinho
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setView('catalog')}>
                    Ver mais produtos
                  </button>
                </div>

                <div className="product-tracks">
                  <h3>Faixas</h3>
                  <ul>
                    {selectedAlbum.tracks.map((track, index) => (
                      <li key={`${track.title}-${index}`}>
                        <button type="button" onClick={() => handleTrackPlay(track)}>
                          <span>{index + 1}. {track.title}</span>
                          <small>{track.duration}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </main>
      ) : view === 'store' ? (
        <>
          <main className="page-content">
            <section className="hero-banner hero-only-image">
              <div className="hero-card slogan-card single-brand-card">
                <img src={sloganImage} alt="The Roots" className="slogan-image" />
              </div>
            </section>

            <section className="categories-block">
              <h2>Categorias principais</h2>
              <div className="category-grid">
                {['VINYL LP´S', 'COMPACTOS 7´´', 'VINIL 10´´ e 12´´', 'RARÍDADES', 'ACESSÓRIOS', 'VESTUÁRIO', 'DESTAQUES'].map((category) => (
                  <button key={category} type="button" className="category-item">
                    {category}
                  </button>
                ))}
              </div>
            </section>

            <section className="products-section">
              <div className="section-header">
                <h2>Destaques</h2>
                <button type="button" className="catalog-link-button" onClick={() => setView('catalog')}>Ver todos os produtos</button>
              </div>

              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <span className="offer-tag">Oferta</span>
                    <button type="button" className="image-link" onClick={() => openProductDetail(product)}>
                      <img src={product.image} alt={product.title} />
                    </button>
                    <div className="product-info">
                      <h3>{product.title}</h3>
                      <div className="price-block">
                        <span className="old-price">R$ {product.oldPrice.toFixed(2)}</span>
                        <span className="discount">{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF</span>
                        <strong>R$ {product.price.toFixed(2)}</strong>
                        <small>3 x de R$ {(product.price / 3).toFixed(2)} sem juros</small>
                      </div>
                      <button type="button" className="add-product" onClick={() => addToCart(product)}>
                        Adicionar ao carrinho
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="products-section secondary-section">
              <div className="section-header">
                <h2>Promoções</h2>
              </div>

              <div className="promo-grid">
                {promoProducts.map((product) => (
                  <article key={product.id} className="promo-card">
                    <div className="promo-image-wrap">
                      <img src={product.image} alt={product.title} />
                    </div>
                    <div className="promo-body">
                      <span className="mini-label">Promo</span>
                      <h3>{product.title}</h3>
                      <div className="promo-price-row">
                        <strong>R$ {product.price.toFixed(2)}</strong>
                        <span>R$ {product.oldPrice.toFixed(2)}</span>
                      </div>
                      <button type="button" onClick={() => addToCart(product)}>Comprar</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="side-panel">
            <div className="player-box">
              <div
                className="album-cover"
                style={{ background: `linear-gradient(135deg, ${selectedAlbum?.accent || '#f97316'}, #111827)` }}
              >
                <img src={selectedAlbum?.image} alt={selectedAlbum?.title} />
              </div>

              <div className="album-details">
                <p className="eyebrow">Preview</p>
                <h3>{selectedAlbum?.title}</h3>
                <p>{selectedAlbum?.artist}</p>
                <strong>R$ {selectedAlbum?.price.toFixed(2)}</strong>
              </div>

              <audio ref={audioRef} controls className="audio-player" />

              <ul className="track-list">
                {selectedAlbum?.tracks.map((track, index) => (
                  <li key={`${track.title}-${index}`}>
                    <button type="button" className={activeTrack?.title === track.title ? 'track-playing' : ''} onClick={() => handleTrackPlay(track)}>
                      <span>{index + 1}. {track.title}</span>
                      <small>{track.duration}</small>
                    </button>
                  </li>
                ))}
              </ul>

              <button type="button" className="buy-button" onClick={() => addToCart(selectedAlbum)}>
                Adicionar ao carrinho
              </button>
            </div>

            <div className="cart-box">
              <h3>Carrinho</h3>
              {cart.length === 0 ? <p>Seu carrinho está vazio.</p> : (
                <ul className="cart-items">
                  {cart.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.quantity} x R$ {item.price.toFixed(2)}</span>
                      </div>
                      <div className="qty-box">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="cart-total-row">
                <span>Total</span>
                <strong>R$ {total.toFixed(2)}</strong>
              </div>

              <button type="button" className="checkout-button" onClick={checkout}>Finalizar compra</button>
              {message && <p className="status-message">{message}</p>}
            </div>
          </aside>
        </>
      ) : view === 'catalog' ? (
        <main className="catalog-page">
          <section className="catalog-header">
            <div>
              <p className="eyebrow">Catálogo completo</p>
              <h2>Todos os produtos</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setView('store')}>Voltar para loja</button>
          </section>

          <section className="catalog-grid">
            {filteredItems.map((product) => (
              <article key={product.id} className="catalog-card product-card">
                <button type="button" className="image-link" onClick={() => openProductDetail(product)}>
                  <img src={product.image} alt={product.title} />
                </button>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p className="catalog-artist">{product.artist}</p>
                  <div className="price-block">
                    <span className="old-price">R$ {product.oldPrice.toFixed(2)}</span>
                    <span className="discount">{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF</span>
                    <strong>R$ {product.price.toFixed(2)}</strong>
                    <small>3 x de R$ {(product.price / 3).toFixed(2)} sem juros</small>
                  </div>
                  <button type="button" className="add-product" onClick={() => addToCart(product)}>
                    Adicionar ao carrinho
                  </button>
                </div>
              </article>
            ))}
          </section>
        </main>
      ) : (
        <main className="admin-page">
          <section className="admin-card">
            <div className="admin-header">
              <div>
                <p className="eyebrow">Painel administrativo</p>
                <h2>{editingId ? 'Editar produto' : 'Cadastrar novo produto'}</h2>
              </div>
              <span className="admin-badge">{items.length} itens</span>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label>
                  Título
                  <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ex: Neon Dreams" />
                </label>

                <label>
                  Artista
                  <input name="artist" value={form.artist} onChange={handleFormChange} placeholder="Ex: The Midnight Echo" />
                </label>

                <label>
                  Gênero
                  <select name="genre" value={form.genre} onChange={handleFormChange}>
                    {['Eletrônica', 'Rock', 'Pop', 'Jazz', 'Indie', 'Synthwave', 'Diversos'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Ano
                  <input type="number" name="year" value={form.year} onChange={handleFormChange} />
                </label>

                <label>
                  Preço
                  <input type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleFormChange} placeholder="89.90" />
                </label>

                <label>
                  Preço antigo
                  <input type="number" step="0.01" min="0" name="oldPrice" value={form.oldPrice} onChange={handleFormChange} placeholder="119.90" />
                </label>

                <label>
                  Estoque
                  <input type="number" min="0" name="stock" value={form.stock} onChange={handleFormChange} />
                </label>

                <label>
                  Cor destaque
                  <input type="color" name="accent" value={form.accent} onChange={handleFormChange} />
                </label>

                <label>
                  Destaque da loja
                  <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={handleFormChange} />
                </label>

                <label className="full-width">
                  URL da imagem
                  <input name="image" value={form.image} onChange={handleFormChange} placeholder="https://..." />
                </label>

                <label className="full-width">
                  Descrição
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows="3" placeholder="Descreva o disco, estilo e clima da obra." />
                </label>

                <label className="full-width">
                  Faixas de áudio
                  <textarea
                    name="tracksText"
                    value={form.tracksText}
                    onChange={handleFormChange}
                    rows="6"
                    placeholder={'Título|Duração|URL\nExemplo: Sunrise|3:42|https://...'}
                  />
                </label>
              </div>

              <div className="admin-actions">
                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(defaultForm);
                      setMessage('Edição cancelada.');
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar produto' : 'Salvar produto'}
                </button>
              </div>

              {message && <p className="status-message admin-status">{message}</p>}
            </form>
          </section>

          <aside className="admin-list-card">
            <h3>Produtos cadastrados</h3>
            <ul className="admin-product-list">
              {items.map((item) => (
                <li key={item.id}>
                  <div className="admin-product-image">
                    <img src={item.image} alt={item.title} />
                  </div>
                  <div className="admin-product-meta">
                    <strong>{item.title}</strong>
                    <span>{item.artist}</span>
                    <small>R$ {item.price.toFixed(2)}</small>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" className="mini-button" onClick={() => handleTogglePublish(item)}>
                      {item.published === false ? 'Publicar' : 'Ocultar'}
                    </button>
                    <button type="button" className="mini-button" onClick={() => handleToggleFeatured(item)}>
                      {item.featured ? 'Remover destaque' : 'Destacar'}
                    </button>
                    <button type="button" className="mini-button" onClick={() => handleEditProduct(item)}>Editar</button>
                    <button type="button" className="mini-button danger" onClick={() => handleDeleteProduct(item.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </main>
      )}
    </div>
  );
}

export default App;

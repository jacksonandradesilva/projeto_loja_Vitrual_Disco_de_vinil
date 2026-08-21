import { useEffect, useMemo, useRef, useState } from 'react';

const API_URL = '/api/catalog';
const CATALOG_KEY = 'the-roots-catalog';
const CART_KEY = 'the-roots-cart';
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
      const matchesFilter = selectedFilter === 'Todos' || album.genre === selectedFilter;
      const matchesSearch =
        album.title.toLowerCase().includes(search.toLowerCase()) ||
        album.artist.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
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

  const featuredProducts = filteredItems.slice(0, 4);
  const promoProducts = filteredItems.slice(0, 3);

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

  const handleTrackPlay = (track) => {
    setActiveTrack(track);
    if (!audioRef.current) return;
    audioRef.current.src = track.url;
    audioRef.current.play();
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const parseTracks = (text) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((entry) => {
        const [title, duration, url] = entry.split('|').map((item) => item.trim());
        return { title, duration: duration || '3:30', url };
      })
      .filter((track) => track.title && track.url);
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
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          tracks
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar produto.');

      const newProduct = data.product;
      const nextCatalog = newProduct ? [...items, newProduct] : items;
      persistCatalog(nextCatalog);
      setSelectedId(newProduct?.id || items[0]?.id);
      setMessage(data.message || 'Produto cadastrado com sucesso!');
      setForm(defaultForm);
      setView('store');
      await loadCatalog();
    } catch (error) {
      setMessage(error.message || 'Erro ao cadastrar produto.');
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
            <button type="button" className={view === 'admin' ? 'view-button active' : 'view-button'} onClick={() => setView('admin')}>Administração</button>
          </div>
        </div>

        <div className="main-header">
          <div className="brand-box">
            <div className="logo-mark">R</div>
            <div>
              <span className="brand-name">The Roots</span>
              <small>vinil & cultura</small>
            </div>
          </div>

          {view === 'store' && (
            <>
              <nav className="main-nav" aria-label="menu principal">
                <a href="#">Início</a>
                <a href="#">Produtos</a>
                <a href="#">Contato</a>
                <a href="#">Política de Privacidade</a>
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

      {view === 'store' ? (
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
                <a href="#">Ver todos os produtos</a>
              </div>

              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <span className="offer-tag">Oferta</span>
                    <button type="button" className="image-link" onClick={() => setSelectedId(product.id)}>
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
      ) : (
        <main className="admin-page">
          <section className="admin-card">
            <div className="admin-header">
              <div>
                <p className="eyebrow">Painel administrativo</p>
                <h2>Cadastrar novo produto</h2>
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
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar produto'}
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
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.artist}</span>
                    <small>R$ {item.price.toFixed(2)}</small>
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

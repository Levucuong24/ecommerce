import Logo from "../../components/Logo";

function CartPage({ onBackHome }) {
  return (
    <main className="cart-page">
      <header className="cart-header">
        <Logo className="cart-brand" />
        <button type="button" className="cart-back-button" onClick={onBackHome}>
          Quay lai trang chu
        </button>
      </header>

      <section className="cart-hero">
        <div className="cart-art">
          <img src="/images/cart.png" alt="Cart" className="cart-image" />
        </div>

        <div className="cart-summary">
          <p className="cart-tag">Gio hang cua ban</p>
          <h1>Giao dien cart xanh trang</h1>
          <p className="cart-copy">
            Noi hien thi cac san pham da chon, so luong, tong tien va nut thanh toan.
          </p>

          <div className="cart-stats">
            <article>
              <span>San pham</span>
              <strong>03</strong>
            </article>
            <article>
              <span>Giam gia</span>
              <strong>120.000d</strong>
            </article>
            <article>
              <span>Tong cong</span>
              <strong>3.490.000d</strong>
            </article>
          </div>

          <div className="cart-actions">
            <button type="button" className="cart-primary">
              Thanh toan
            </button>
            <button type="button" className="cart-secondary" onClick={onBackHome}>
              Tiep tuc mua sam
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CartPage;

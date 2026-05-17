export default function VoucherModal({ onClose }) {
  return (
    <div className="voucher-modal-overlay" onClick={onClose}>
      <div className="voucher-modal" onClick={e => e.stopPropagation()}>
        <div className="voucher-modal-header">
          <h3>Mã Giảm Giá</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="voucher-list">
          <div className="voucher-item">
            <div className="voucher-info">
              <h4>Giảm 17%</h4>
              <p>Đơn Tối Thiểu 100k</p>
              <p className="voucher-exp">HSD: 30/06/2026</p>
            </div>
            <button className="save-voucher-btn" onClick={() => alert("Đã lưu mã giảm giá!")}>Lưu</button>
          </div>
          <div className="voucher-item">
            <div className="voucher-info">
              <h4>Giảm 25K</h4>
              <p>Đơn Tối Thiểu 200k</p>
              <p className="voucher-exp">HSD: 30/06/2026</p>
            </div>
            <button className="save-voucher-btn" onClick={() => alert("Đã lưu mã giảm giá!")}>Lưu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

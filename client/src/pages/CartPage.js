// client/src/pages/CartPage.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import CartContext from '../context/CartContext';

const CartPage = () => {
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useContext(CartContext);

  const calculateTotal = () => {
    // Assuming a fixed price for now, you should get this from book details or your DB
    return cart.reduce((total, item) => total + (item.price || 500) * item.quantity, 0); // 500 cents = $5
  };

  return (
    <div>
      <h2 className="mb-4">Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <div className="alert alert-info">Your cart is empty. <Link to="/dashboard">Start Browse!</Link></div>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Quantity</th>
                <th scope="col">Price</th>
                <th scope="col">Total</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.book_id}>
                  <td>{item.title}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.book_id, parseInt(e.target.value))}
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td>${((item.price || 500) / 100).toFixed(2)}</td> {/* Display in dollars */}
                  <td>${(((item.price || 500) * item.quantity) / 100).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFromCart(item.book_id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center mt-4">
            <h4>Grand Total: ${ (calculateTotal() / 100).toFixed(2) }</h4>
            <div>
              <button className="btn btn-warning me-2" onClick={clearCart}>Clear Cart</button>
              <Link to="/checkout" className="btn btn-success">Proceed to Checkout</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
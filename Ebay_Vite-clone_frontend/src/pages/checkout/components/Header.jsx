import React from 'react';

const Header = () => (
    <header className="header">
        <div className="header-content">
            <a href="#" className="logo">ebay</a>
            <div className="search-bar">
                <input type="text" placeholder="Tìm kiếm bất cứ thứ gì" />
                <button>Tìm kiếm</button>
            </div>
            <nav className="nav">
                <a href="#">Chào</a>
                <a href="#"><i className="fas fa-shopping-cart"></i> Giỏ hàng</a>
            </nav>
        </div>
    </header>
);

export default Header;
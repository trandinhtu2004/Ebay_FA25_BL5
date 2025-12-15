import React from 'react';

const PaymentSection = ({ paymentMethod, setPaymentMethod }) => {
    const options = [
        { id: 'MoMo', icon: 'fab fa-cc-visa', label: 'MoMo' },
    ];

    return (
        <section className="section-box payment-section">
            <h2 className="section-title">2. Phương thức Thanh toán</h2>
            <div className="payment-options">
                
                {options.map(option => (
                    <div className="radio-group" key={option.id}>
                        <input 
                            type="radio" 
                            id={option.id} 
                            name="paymentMethod" 
                            value={option.id} 
                            checked={paymentMethod === option.id}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <label htmlFor={option.id}>
                            <i className={option.icon}></i> {option.label}
                        </label>
                    </div>
                ))}
                
            </div>
        </section>
    );
};

export default PaymentSection;
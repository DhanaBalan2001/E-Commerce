import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './faq.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();

  const faqData = [
    {
      question: "How do I create an account?",
      answer: "Click on the 'Sign Up' button in the top right corner of our website. Fill in your details including name, email, and password. You'll receive a confirmation email to verify your account."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secured with SSL encryption."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. International shipping may take 7-14 business days depending on the destination."
    },
    {
      question: "Can I track my order?",
      answer: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and visiting the 'My Orders' section."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we offer 24/7 customer support via live chat, email, and phone. Our support team is always ready to help you with any questions or concerns."
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent."
    },
    {
      question: "How do I cancel my order?",
      answer: "You can cancel your order within 1 hour of placing it by contacting our customer service team. After that, the order may have already been processed for shipping."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'FAQ', path: '/faq' }
  ];

  return (
    <div className="faq-container">
      

      <div className="faq-header">
        <h1 style={{fontSize: '1.2rem'}}>Frequently Asked Questions</h1>
        <p>Find answers to common questions about our services</p>
      </div>

      <div className="faq-content">
        {faqData.map((item, index) => (
          <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleFAQ(index)}>
              <h3 style={{fontSize: '0.9rem'}}>{item.question}</h3>
              <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
            </div>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>     
    </div>
  );
};

export default FAQ;

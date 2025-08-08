import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './privacypolicy.css';

const PrivacyPolicy = () => {
  const [lastUpdated] = useState('December 2024');
  const navigate = useNavigate();

  const sections = [
    {
      id: 'information-collection',
      title: '🔍 Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We collect personal information that you voluntarily provide to us when you register on our website, make a purchase, subscribe to our newsletter, or contact us. This may include your name, email address, phone number, shipping address, billing address, and payment information.'
        },
        {
          subtitle: 'Automatically Collected Information',
          text: 'When you visit our website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. We also collect information about the individual web pages or products that you view, what websites or search terms referred you to our site, and information about how you interact with our site.'
        },
        {
          subtitle: 'Order Information',
          text: 'When you make a purchase, we collect order information including the products you have purchased, your shipping preferences, and any special instructions you provide.'
        }
      ]
    },
    {
      id: 'information-use',
      title: '🎯 How We Use Your Information',
      content: [
        {
          subtitle: 'Order Processing',
          text: 'We use your personal information to process and fulfill your orders, communicate with you about your orders, and provide customer support.'
        },
        {
          subtitle: 'Marketing Communications',
          text: 'With your consent, we may send you marketing emails about new products, special offers, and other updates. You can unsubscribe from these communications at any time.'
        },
        {
          subtitle: 'Website Improvement',
          text: 'We use the information we collect to improve and optimize our website, understand customer preferences, and enhance your shopping experience.'
        },
        {
          subtitle: 'Legal Compliance',
          text: 'We may use your information to comply with applicable laws and regulations, respond to legal requests, and protect our rights and interests.'
        }
      ]
    },
    {
      id: 'information-sharing',
      title: '🤝 Information Sharing',
      content: [
        {
          subtitle: 'Third-Party Service Providers',
          text: 'We may share your information with third-party service providers who help us operate our website, process payments, fulfill orders, and provide customer support. These providers are bound by confidentiality agreements and are only authorized to use your information as necessary to provide services to us.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred to the acquiring entity.'
        }
      ]
    },
    {
      id: 'data-security',
      title: '🛡️ Data Security',
      content: [
        {
          subtitle: 'Security Measures',
          text: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
        },
        {
          subtitle: 'Payment Security',
          text: 'All payment transactions are processed through secure, encrypted connections. We do not store your complete credit card information on our servers.'
        },
        {
          subtitle: 'Data Retention',
          text: 'We retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.'
        }
      ]
    },
    {
      id: 'cookies',
      title: '🍪 Cookies and Tracking',
      content: [
        {
          subtitle: 'What Are Cookies',
          text: 'Cookies are small data files that are placed on your device when you visit our website. We use cookies to remember your preferences, understand how you use our site, and improve your experience.'
        },
        {
          subtitle: 'Types of Cookies We Use',
          text: 'We use essential cookies (necessary for the website to function), performance cookies (to analyze website usage), and marketing cookies (to personalize content and ads).'
        },
        {
          subtitle: 'Cookie Management',
          text: 'You can control and manage cookies through your browser settings. However, disabling certain cookies may affect the functionality of our website.'
        }
      ]
    },
    {
      id: 'your-rights',
      title: '⚖️ Your Rights',
      content: [
        {
          subtitle: 'Access and Correction',
          text: 'You have the right to access, update, or correct your personal information. You can do this by logging into your account or contacting us directly.'
        },
        {
          subtitle: 'Data Portability',
          text: 'You have the right to request a copy of your personal information in a structured, machine-readable format.'
        },
        {
          subtitle: 'Deletion',
          text: 'You have the right to request deletion of your personal information, subject to certain legal obligations and legitimate business interests.'
        },
        {
          subtitle: 'Opt-Out',
          text: 'You can opt out of marketing communications at any time by clicking the unsubscribe link in our emails or contacting us directly.'
        }
      ]
    },
    {
      id: 'children-privacy',
      title: '👶 Children\'s Privacy',
      content: [
        {
          subtitle: 'Age Restrictions',
          text: 'Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.'
        },
        {
          subtitle: 'Parental Consent',
          text: 'If we learn that we have collected personal information from a child under 18 without parental consent, we will take steps to delete that information as quickly as possible.'
        }
      ]
    },
    {
      id: 'international-transfers',
      title: '🌍 International Data Transfers',
      content: [
        {
          subtitle: 'Cross-Border Transfers',
          text: 'Your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers are made in accordance with applicable data protection laws.'
        },
        {
          subtitle: 'Safeguards',
          text: 'When we transfer your information internationally, we implement appropriate safeguards to ensure your information receives an adequate level of protection.'
        }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Information Collection', id: 'information-collection' },
    { title: 'How We Use Data', id: 'information-use' },
    { title: 'Information Sharing', id: 'information-sharing' },
    { title: 'Data Security', id: 'data-security' },
    { title: 'Cookies & Tracking', id: 'cookies' },
    { title: 'Your Rights', id: 'your-rights' },
    { title: 'Children\'s Privacy', id: 'children-privacy' },
    { title: 'International Transfers', id: 'international-transfers' }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy-policy' }
  ];

  return (
    <div className="privacy-policy-page">

      {/* Hero Section */}
      <section className="privacy-hero">
        <Col lg={8} className="mx-auto text-center">
              <h1 className="privacy-hero-title">
                  Privacy Policy
             </h1>
         </Col>
    </section>

      {/* Privacy Policy Content */}
      <section className="privacy-content-section mobile-close">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              {/* Introduction */}
              <Card className="intro-card mb-4">
                <Card.Body>
                  <h2 className="intro-title">
                    <span className="intro-icon">👋</span>
                    Welcome to Our Privacy Policy
                  </h2>
                  <p className="intro-text">
                    At <strong>Sindhu Crackers</strong>, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.
                  </p>
                  <p className="intro-text">
                    By using our website and services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                  </p>
                </Card.Body>
              </Card>

              {/* Policy Sections */}
              {sections.map((section, index) => (
                <Card key={index} id={section.id} className="policy-section-card mb-4">
                  <Card.Body>
                    <h2 className="section-title">{section.title}</h2>
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="content-item">
                        <h4 className="content-subtitle">{item.subtitle}</h4>
                        <p className="content-text">{item.text}</p>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              ))}
            </Col>
          </Row>
        </Container>
      </section>

     
    </div>
  );
};

export default PrivacyPolicy;

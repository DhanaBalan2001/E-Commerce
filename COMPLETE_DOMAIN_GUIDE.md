# 🌐 Complete Domain & Deployment Guide

## 🛒 Step 1: Buy Domain (10 minutes)

### **Recommended Names:**
- `sindhucrackers.com` ✅
- `crackersshop.com`
- `festivecrackers.com`

### **Buy from Namecheap:**
1. Go to [namecheap.com](https://namecheap.com)
2. Search "sindhucrackers.com"
3. Add to cart (₹800-1200/year)
4. Enable WhoisGuard (free privacy)
5. Complete payment with card/UPI

## 🚀 Step 2: Deploy Frontend (Netlify)

### **Build & Deploy:**
```bash
cd client
npm run build
```

1. Go to [netlify.com](https://netlify.com)
2. Sign up → "Add new site" → "Deploy manually"
3. Drag `dist` folder
4. Get URL: `https://random-name.netlify.app`

### **Connect Domain:**
1. Netlify dashboard → Domain management
2. "Add custom domain" → Enter `sindhucrackers.com`
3. Note the DNS instructions

## 🔧 Step 3: Configure DNS (Namecheap)

1. Login to Namecheap → Domain List → Manage
2. Advanced DNS → Delete existing records
3. Add these records:

```
Type: A Record
Host: @
Value: 75.2.60.5

Type: CNAME Record  
Host: www
Value: your-netlify-site.netlify.app
```

## 🖥️ Step 4: Deploy Backend (Render)

1. Go to [render.com](https://render.com)
2. Connect GitHub → New Web Service
3. Select your repository
4. Settings:
```
Build Command: cd server && npm install
Start Command: cd server && npm start
```

5. Environment Variables:
```
NODE_ENV=production
MONGODB=mongodb+srv://dhana:dhana@products.crc78mo.mongodb.net/
JWT=4d8d019c0ac39bf9ce033abdfa1589f0b3a22cfce6073f7330c34f6289ca49c6
FRONTEND_URL=https://sindhucrackers.com
EMAIL_USER=sindhucrackers@gmail.com
EMAIL_PASS=fhhy mhyf kurc vwrn
```

## 🔄 Step 5: Update & Redeploy

### **Update API URL:**
```bash
cd client
echo "VITE_API_BASE_URL=https://your-render-app.onrender.com" > .env.production
npm run build
```

### **Redeploy to Netlify:**
- Drag new `dist` folder to Netlify

## ✅ Step 6: Final Setup

### **Wait 24-48 hours for:**
- DNS propagation
- SSL certificate activation
- Domain to work properly

### **Test Your Site:**
- Visit `https://sindhucrackers.com`
- Check all pages work
- Test product browsing

## 🔍 Step 7: Google Setup

### **Google Search Console:**
1. [search.google.com/search-console](https://search.google.com/search-console)
2. Add `https://sindhucrackers.com`
3. Verify ownership
4. Submit sitemap: `/sitemap.xml`

### **Google My Business:**
1. [business.google.com](https://business.google.com)
2. Add business details
3. Website: `https://sindhucrackers.com`

## 💰 Total Cost: ₹800-1200/year

**Your website will be live at `https://sindhucrackers.com` within 48 hours!** 🎆
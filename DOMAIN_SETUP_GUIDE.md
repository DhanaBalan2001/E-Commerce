# 🌐 Complete Domain Setup Guide for Crackers Website

## 🛒 Step 1: Buy a Domain (10 minutes)

### **Recommended Domain Names:**
- `sindhucrackers.com` 
- `crackersshop.com`
- `fireworksstore.com`
- `crackersbazaar.com`
- `festivecrackers.com`

### **Best Domain Providers:**

#### **Option A: Namecheap (Recommended)**
1. Go to [namecheap.com](https://namecheap.com)
2. Search your domain name
3. Add to cart (₹800-1200/year)
4. **IMPORTANT**: Enable "WhoisGuard" (free privacy protection)
5. Complete payment

#### **Option B: GoDaddy**
1. Go to [godaddy.com](https://godaddy.com)
2. Search domain
3. Add to cart (₹900-1500/year)
4. **Skip all upsells** except domain privacy
5. Complete payment

#### **Option C: Hostinger (Cheapest)**
1. Go to [hostinger.in](https://hostinger.in)
2. Search domain (₹600-900/year)
3. Add to cart
4. Complete payment

## 🚀 Step 2: Deploy Frontend (Netlify)

### **Deploy to Netlify:**
1. Build your React app:
```bash
cd client
npm run build
```

2. Go to [netlify.com](https://netlify.com)
3. Sign up with GitHub/Google
4. Click "Add new site" → "Deploy manually"
5. Drag & drop the `dist` folder
6. Get temporary URL: `https://random-name.netlify.app`

### **Connect Custom Domain:**
1. In Netlify dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain: `sindhucrackers.com`
4. Click "Verify"

## 🔧 Step 3: Configure DNS Settings

### **In Your Domain Provider (Namecheap/GoDaddy):**

#### **Namecheap DNS Setup:**
1. Login to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Delete existing records
5. Add these records:

```
Type: CNAME Record
Host: www
Value: your-netlify-site.netlify.app
TTL: Automatic

Type: A Record  
Host: @
Value: 75.2.60.5
TTL: Automatic

Type: CNAME Record
Host: *
Value: your-netlify-site.netlify.app
TTL: Automatic
```

#### **GoDaddy DNS Setup:**
1. Login to GoDaddy
2. My Products → DNS
3. Add records:

```
Type: CNAME
Name: www
Value: your-netlify-site.netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

## 🖥️ Step 4: Deploy Backend (Render)

### **Deploy API to Render:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:

```
Name: crackers-api
Environment: Node
Build Command: cd server && npm install
Start Command: cd server && npm start
```

6. Add Environment Variables:
```
NODE_ENV=production
MONGODB=mongodb+srv://dhana:dhana@products.crc78mo.mongodb.net/
JWT=4d8d019c0ac39bf9ce033abdfa1589f0b3a22cfce6073f7330c34f6289ca49c6
JWT_EXPIRE=7d
FRONTEND_URL=https://sindhucrackers.com
EMAIL_USER=sindhucrackers@gmail.com
EMAIL_PASS=fhhy mhyf kurc vwrn
```

7. Deploy → Get API URL: `https://crackers-api.onrender.com`

## 🔄 Step 5: Update Configuration Files

### **Update Frontend Environment:**
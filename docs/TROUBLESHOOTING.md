# Troubleshooting Guide

**Common Issues and Solutions for MegaVibe Development**

This guide covers the most common issues developers encounter when working with MegaVibe, particularly around wallet integration, routing, and provider setup.

## 🚨 Critical Issues

### "useWallet must be used within a WalletProvider"

**Error Message:**
```
Error: useWallet must be used within a WalletProvider
    at useWallet (WalletContext.tsx:53:11)
    at TipPage (TipPage.tsx:60:45)
```

**Root Cause:** 
The component is trying to use the wallet context outside of the provider wrapper.

**Solution:**
Ensure all routes are wrapped in `AppProviders`:

```typescript
// ✅ Correct - main.tsx
import { AppProviders } from './components/AppProviders';

root.render(
  <React.StrictMode>
    <AppProviders>  {/* ← This wraps ALL routes */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/tip" element={<TipPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);
```

**❌ Wrong Way:**
```typescript
// Don't do this - providers only wrap individual routes
<BrowserRouter>
  <Routes>
    <Route path="/" element={
      <AppProviders>
        <App />
      </AppProviders>
    } />
    <Route path="/tip" element={<TipPage />} />  {/* ← Not wrapped! */}
  </Routes>
</BrowserRouter>
```

### Dynamic.xyz Chain Configuration Warnings

**Error Message:**
```
[DynamicWagmiConnector] [WARN]: Chain (id: 1 name: Ethereum) is present in the Wagmi config, but is not present in the Dynamic configuration.
```

**Root Cause:** 
Mismatch between chains configured in Wagmi vs Dynamic.

**Solution:**
Ensure only Mantle Sepolia is configured in both:

```typescript
// ✅ Correct - AppProviders.tsx
const mantleSepolia = {
  id: 5003,  // Only this chain
  name: 'Mantle Sepolia',
  // ... rest of config
};

const config = createConfig({
  chains: [mantleSepolia],  // Only Mantle Sepolia
  // ...
});

// Dynamic configuration
settings={{
  environmentId: 'your-env-id',
  walletConnectors: [EthereumWalletConnectors],
  overrides: {
    evmNetworks: [
      {
        chainId: 5003,  // Must match Wagmi
        chainName: 'Mantle Sepolia',
        // ...
      }
    ]
  }
}}
```

**❌ Wrong Way:**
```typescript
// Don't include multiple chains if Dynamic only knows about one
const config = createConfig({
  chains: [mantleSepolia, mainnet],  // ← This causes the warning
});
```

## 🔧 Environment Issues

### Environment Variables Not Loading

**Symptoms:**
- Wallet connects but shows wrong network
- Contract address undefined
- Debug logs showing default values

**Solution:**
1. **Check file naming:**
   ```bash
   # Development
   .env.development  ✅
   .env.local       ✅
   .env             ✅
   
   # Wrong
   .env.dev         ❌
   env.development  ❌
   ```

2. **Verify variable names:**
   ```bash
   # Must start with VITE_
   VITE_MANTLE_CHAIN_ID=5003        ✅
   MANTLE_CHAIN_ID=5003             ❌
   
   # Check for typos
   VITE_DYNAMIC_ENVIRONMENT_ID      ✅
   VITE_DYNAMIC_ENVIRONEMENT_ID     ❌ (missing 'M')
   ```

3. **Restart dev server after .env changes:**
   ```bash
   # Kill dev server and restart
   Ctrl+C
   npm run dev
   ```

### Debug Mode Not Working

**Enable debug mode:**
```bash
# In .env file
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

**Check console output:**
- Should see "🔧 MegaVibe Environment Configuration"
- Should see wallet state updates
- Should see diagnostic results

## 🌐 Network Issues

### Wallet Won't Switch to Mantle Sepolia

**Symptoms:**
- "Update Network" dialog appears
- Wallet shows unsupported network
- Network switch button doesn't work

**Solutions:**

1. **Check RPC URL accessibility:**
   ```javascript
   // Test in browser console
   fetch('https://rpc.sepolia.mantle.xyz', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       jsonrpc: '2.0',
       method: 'eth_chainId',
       params: [],
       id: 1
     })
   }).then(r => r.json()).then(console.log);
   ```

2. **Manual network addition:**
   - Open MetaMask
   - Settings → Networks → Add Network
   - Fill in Mantle Sepolia details:
     ```
     Network Name: Mantle Sepolia
     RPC URL: https://rpc.sepolia.mantle.xyz
     Chain ID: 5003
     Currency Symbol: MNT
     Block Explorer: https://explorer.sepolia.mantle.xyz
     ```

3. **Clear wallet cache:**
   - MetaMask: Settings → Advanced → Reset Account
   - Coinbase Wallet: Disconnect and reconnect

### RPC Connection Failures

**Check network connectivity:**
```bash
# Test RPC endpoint
curl -X POST https://rpc.sepolia.mantle.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x138b"}
```

## 🔄 Routing Issues

### Page Crashes on Direct URL Access

**Symptoms:**
- `/tip` works when navigated from home page
- Direct access to `/tip` crashes
- Browser refresh causes errors

**Root Cause:**
Different provider wrappers for different routes.

**Solution:**
Use centralized AppProviders as shown in critical issues above.

### State Not Persisting Across Routes

**Symptoms:**
- Wallet disconnects when navigating
- Balance resets between pages
- Have to reconnect wallet on each page

**Solution:**
Ensure AppProviders wraps the Router, not individual routes:

```typescript
// ✅ Correct
<AppProviders>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/tip" element={<TipPage />} />
    </Routes>
  </BrowserRouter>
</AppProviders>

// ❌ Wrong
<BrowserRouter>
  <AppProviders>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/tip" element={<TipPage />} />
    </Routes>
  </AppProviders>
</BrowserRouter>
```

## 💰 Transaction Issues

### "Insufficient Funds" Errors

**Check balance:**
1. Ensure wallet has MNT tokens
2. Get testnet tokens: https://faucet.sepolia.mantle.xyz/
3. Verify correct network (Mantle Sepolia, not mainnet)

**Verify gas estimation:**
```typescript
// Check if contract interaction is working
const { isWalletReady } = useWallet();

if (!isWalletReady()) {
  console.log('Wallet not ready for transactions');
  return;
}
```

### Contract Interaction Failures

**Check contract address:**
```bash
# Verify in .env
VITE_TIPPING_CONTRACT_ADDRESS=0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F
```

**Verify on explorer:**
Visit: https://explorer.sepolia.mantle.xyz/address/0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F

## 🧪 Development Issues

### Hot Reload Not Working

**Solutions:**
1. **Clear browser cache:** Hard refresh (Ctrl+Shift+R)
2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```
3. **Check file changes:** Ensure files are being saved

### TypeScript Errors After Updates

**Common fixes:**
1. **Restart TypeScript server** in VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"
2. **Clear TypeScript cache:**
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   npm run dev
   ```
3. **Check imports:** Verify all imports resolve correctly

### Dynamic.xyz SDK Issues

**Version conflicts:**
```bash
# Ensure all Dynamic packages are same version
npm list | grep dynamic
```

**Update all Dynamic packages:**
```bash
npm update @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/wagmi-connector
```

## 🔍 Debugging Tools

### Enable Comprehensive Logging

```bash
# In .env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Browser Console Commands

```javascript
// Check environment configuration
console.log(import.meta.env);

// Check Dynamic context
// (run in component context)
const { primaryWallet } = useDynamicContext();
console.log('Primary wallet:', primaryWallet);

// Check wallet service
import { walletService } from './services/walletService';
console.log('Wallet service ready:', await walletService.isReady());
```

### Network Analysis

**Check Dynamic.xyz connection:**
1. Open Network tab in DevTools
2. Look for requests to Dynamic.xyz APIs
3. Check for 401/403 errors (invalid environment ID)

**Check RPC calls:**
1. Filter network requests by 'rpc'
2. Look for successful POST requests to Mantle RPC
3. Verify chain ID responses

## 🆘 When All Else Fails

### Complete Reset

1. **Clear all caches:**
   ```bash
   # Node modules
   rm -rf node_modules
   npm install
   
   # Browser cache
   # Chrome: DevTools → Application → Storage → Clear site data
   ```

2. **Reset wallet:**
   - MetaMask: Settings → Advanced → Reset Account
   - Clear browser local storage
   - Reconnect wallet

3. **Verify base setup:**
   ```bash
   # Check Node version
   node --version  # Should be 18+
   
   # Check environment
   cat .env.development
   
   # Test basic functionality
   npm run dev
   ```

### Get Help

1. **Check console logs** with debug mode enabled
2. **Run diagnostics** (automatic in debug mode)
3. **Verify environment variables** are loaded correctly
4. **Test with different wallet** (MetaMask vs Coinbase)
5. **Try different browser** to rule out extension conflicts

### Common "It was working before" Issues

1. **Environment variables changed** - check .env files
2. **Node modules updated** - check package versions
3. **Network connectivity** - test RPC endpoints
4. **Browser extensions** - try incognito mode
5. **Local storage corruption** - clear browser data

Remember: Most issues are environment or configuration related. The diagnostic tools will usually point you to the root cause.
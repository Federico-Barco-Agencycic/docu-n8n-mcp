# 🚀 Deployment Guide for GitHub Pages

## Quick Setup

### 1. **Prepare Database**
```bash
# Copy the database from n8n-mcp project
cp ../n8n-mcp/nodes.db ./data/nodes.db
```

### 2. **Generate Static API**
```bash
# Generate all static endpoints for GitHub Pages
npm run deploy
```

This will create:
- 📊 `/api/database-statistics.json` - Ecosystem stats
- 🔍 `/api/search-index.json` - Search optimization
- 📋 `/api/list-nodes/` - Filtered node lists
- 📄 `/api/nodes-detailed/` - Complete schemas (500+ files)
- ⚡ `/api/nodes-essentials/` - Essential properties (500+ files)
- 🤖 `/api/ai-tools-detailed.json` - AI capabilities
- 🛠️ `/api/tasks-config.json` - Pre-configured setups
- 🎯 `/api/properties-index.json` - Property search
- 📋 `/api/property-dependencies.json` - Visibility rules
- 📚 `/api/templates-index.json` - Workflow patterns
- 📄 `/api/api-manifest.json` - Complete API structure

### 3. **Deploy to GitHub Pages**
```bash
# Commit and push
git add .
git commit -m "🚀 Deploy static API with 17 n8n-MCP tools"
git push origin main

# Enable GitHub Pages in repo settings:
# Settings > Pages > Source: Deploy from branch > main > / (root)
```

### 4. **Verify Deployment**
Visit: `https://your-username.github.io/docu-n8n-mcp/`

## 📊 Generated Files Structure

```
api/
├── database-statistics.json           # Tool 1: Statistics
├── search-index.json                  # Tool 2: Search
├── list-nodes/                        # Tool 3: Filtering
│   ├── category-trigger.json
│   ├── category-transform.json
│   ├── category-output.json
│   ├── category-input.json
│   ├── package-n8n-nodes-base.json
│   ├── package-_n8n_n8n-nodes-langchain.json
│   └── ai-tools-only.json            # Tool 10: AI Tools List
├── nodes-detailed/                    # Tool 4: Complete Info
│   ├── nodes-base_slack.json
│   ├── nodes-base_httpRequest.json
│   └── ... (500+ files)
├── nodes-essentials/                  # Tool 5: Essentials
│   ├── nodes-base_slack.json
│   ├── nodes-base_webhook.json
│   └── ... (500+ files)
├── tasks-config.json                  # Tools 8-9: Tasks
├── ai-tools-detailed.json             # Tools 10-11: AI Info
├── properties-index.json              # Tool 12: Property Search
├── property-dependencies.json         # Tool 13: Dependencies
├── templates-index.json               # Tools 14-17: Templates
└── api-manifest.json                  # API Structure
```

## 🔧 Available Scripts

```bash
# Development
npm run clean           # Clear api/ directory
npm run export          # Export from database
npm run build-pages     # Generate GitHub Pages optimized files
npm run validate        # Validate JSON structure
npm run serve           # Local development server

# Deployment
npm run deploy          # Full GitHub Pages deployment
npm run dev             # Clean + Deploy + Serve
```

## 🌐 GitHub Pages Configuration

### Repository Settings
1. Go to **Settings > Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)

### Custom Domain (Optional)
Add a `CNAME` file with your domain:
```bash
echo "your-domain.com" > CNAME
```

## 📈 Performance Optimizations

- **File Size**: Individual node files are split for faster loading
- **Caching**: Static files are cached by GitHub's CDN
- **Compression**: All JSON is minified
- **Structure**: Hierarchical organization for efficient browsing
- **Cross-References**: URLs between related endpoints

## 🔍 Verification Checklist

After deployment, verify these endpoints work:

- [ ] `https://your-site/api/database-statistics.json`
- [ ] `https://your-site/api/search-index.json`
- [ ] `https://your-site/api/list-nodes/ai-tools-only.json`
- [ ] `https://your-site/api/nodes-essentials/nodes-base_slack.json`
- [ ] `https://your-site/api/tasks-config.json`
- [ ] `https://your-site/api/api-manifest.json`

## 🚨 Troubleshooting

### Database Not Found
```bash
# Make sure database exists
ls -la data/nodes.db

# If missing, copy from n8n-mcp
cp ../n8n-mcp/nodes.db ./data/nodes.db
```

### GitHub Pages Not Working
1. Check repository is public
2. Verify Pages is enabled in Settings
3. Wait 5-10 minutes for deployment
4. Check Actions tab for build errors

### CORS Issues
GitHub Pages automatically serves with proper CORS headers. If you have issues:
1. Use HTTPS URLs
2. Check browser console for errors
3. Verify file paths are correct

## 📊 Usage Analytics

Track API usage with:
- GitHub repository insights
- Google Analytics (add to index.html)
- Custom tracking in consuming applications

## 🔄 Updates

To update the API:
1. Update the source database
2. Run `npm run deploy`
3. Commit and push changes
4. GitHub Pages will auto-update in ~5 minutes

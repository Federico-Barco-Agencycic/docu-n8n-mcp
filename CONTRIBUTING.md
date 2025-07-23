# Contributing to docu-n8n-mcp

Thank you for your interest in contributing to docu-n8n-mcp! This project provides a static JSON API for n8n node documentation and metadata.

## 🚀 Quick Start

This is primarily a **read-only API** generated from the [n8n-mcp](https://github.com/fbarco/n8n-mcp) database. However, there are several ways you can contribute:

## 📋 Types of Contributions

### 1. 🐛 Bug Reports
If you find issues with the API structure, data format, or missing information:

- **For node data issues**: Report in [n8n-mcp repository](https://github.com/fbarco/n8n-mcp)
- **For API structure issues**: Open an issue in this repository

### 2. 💡 Feature Requests
Ideas for improving the API structure, adding new endpoints, or enhancing the data format:

- Open an issue with the `enhancement` label
- Describe your use case and proposed solution
- Include examples of how it would be used

### 3. 🔧 Script Improvements
Enhancements to the build scripts, validation, or deployment process:

- Fork the repository
- Make your changes in the `scripts/` directory
- Test thoroughly with the existing database
- Submit a pull request

### 4. 📚 Documentation
Improvements to README, examples, or documentation:

- Fix typos or unclear instructions
- Add usage examples in different languages
- Improve API documentation

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- Git
- Access to n8n-mcp database (for testing)

### Setup
```bash
# Fork and clone your fork
git clone https://github.com/YOUR-USERNAME/docu-n8n-mcp.git
cd docu-n8n-mcp

# Install dependencies
npm install

# Copy database for testing (if you have n8n-mcp locally)
cp ../n8n-mcp/data/nodes.db ./data/nodes.db

# Or download it
curl -L -o data/nodes.db "https://github.com/federico-barco-agencycic/n8n-mcp/raw/main/data/nodes.db"

# Build and test
npm run deploy
```

## 📝 Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-improvement`
3. **Make** your changes
4. **Test** thoroughly:
   ```bash
   npm run deploy
   npm run validate
   ```
5. **Commit** with clear messages
6. **Push** to your fork
7. **Submit** a pull request

### Pull Request Guidelines

- **Clear description** of what the PR does
- **Test results** showing the build works
- **Breaking changes** clearly documented
- **Examples** of new functionality if applicable

## 🧪 Testing

Before submitting changes:

```bash
# Run full build pipeline
npm run deploy

# Check all files are valid
npm run validate

# Test locally
npm run serve
# Visit http://localhost:8080/api/index.json
```

## 📊 Data Source

This API is generated from the n8n-mcp database. If you need to update node information:

1. **Node metadata**: Contribute to [n8n-mcp](https://github.com/fbarco/n8n-mcp)
2. **API structure**: Contribute to this repository

## 🎯 Areas for Contribution

### High Impact
- 🔍 **Search improvements**: Better indexing or filtering
- 📊 **New endpoints**: Additional ways to query the data
- 🚀 **Performance**: Optimizations for large datasets
- 📱 **Mobile optimization**: Better mobile API experience

### Medium Impact
- 📝 **Documentation**: More examples and use cases
- 🔧 **Build tools**: Script improvements
- 🧪 **Testing**: Additional validation
- 🌐 **Internationalization**: Multi-language support

### Low Impact (Good for beginners)
- 🐛 **Bug fixes**: Small issues and improvements
- 📚 **Typos**: Documentation corrections
- 🎨 **Formatting**: JSON structure improvements
- ✅ **Validation**: Additional checks

## 📋 Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested

## 🤝 Code of Conduct

This project follows a simple code of conduct:

- **Be respectful** to all participants
- **Be constructive** in feedback and discussions
- **Focus on the project** and its goals
- **Help others** learn and contribute

## 🎉 Recognition

Contributors will be:
- Listed in the README contributors section
- Mentioned in release notes for significant contributions
- Given credit in the changelog

## 📞 Questions?

- **General questions**: Open a GitHub issue
- **n8n node data**: Ask in [n8n-mcp](https://github.com/fbarco/n8n-mcp)
- **n8n community**: Join [n8n Community Forum](https://community.n8n.io/)

---

Thank you for helping make the n8n ecosystem more accessible! 🚀

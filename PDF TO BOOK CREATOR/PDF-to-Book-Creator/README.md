# PDF to Book Creator – Plug & Play

Transform your documents into professional print-ready books with one click via Lulu API.

## Features

- 📄 **Document Upload**: Support for PDF, DOCX, and ODT files
- 📐 **Professional Templates**: 5 book formats with proper margins and bleed
- 🎨 **Cover Design**: Custom covers with AI generation and style gallery
- 💰 **Real-time Pricing**: Instant cost calculation via Lulu API
- 🖨️ **One-Click Printing**: Direct integration with Lulu's print-on-demand
- 📊 **Order Tracking**: Real-time status updates and tracking
- 📱 **Responsive Design**: Works on desktop and mobile

## Technology Stack

- **React** + **TypeScript** for robust frontend development
- **Tailwind CSS** for responsive styling
- **Shadcn-ui** components for professional UI
- **Lulu API** integration for print-on-demand services
- **Vite** for fast development and building

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your Lulu API credentials:
```env
# For production use, get these from Lulu Developer Portal
VITE_LULU_CLIENT_ID=your_actual_client_id
VITE_LULU_CLIENT_SECRET=your_actual_client_secret
VITE_LULU_API_BASE=https://api.lulu.com/v1

# Set to false when using real API credentials
VITE_DEV_MODE=false
```

### 2. Development Mode

The application runs in **development mode** by default with mock API responses. This allows you to test all features without needing real Lulu API credentials.

To use real Lulu API:
1. Sign up at [Lulu Developer Portal](https://developers.lulu.com/)
2. Create an application and get your client credentials
3. Update your `.env` file with real credentials
4. Set `VITE_DEV_MODE=false`

### 3. Installation & Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

## Usage

1. **Upload Document**: Drag and drop your PDF, DOCX, or ODT file
2. **Choose Template**: Select from 5 professional book formats
3. **Design Cover**: Customize with styles, images, and text
4. **Review Cost**: Get instant pricing with shipping options
5. **Submit Order**: One-click submission to Lulu for printing

## API Integration

The application integrates with Lulu's Print-on-Demand API for:
- **Authentication**: OAuth2 client credentials flow
- **Cost Calculation**: Real-time pricing for different book formats
- **File Validation**: Ensure files meet print quality standards  
- **Print Job Creation**: Submit orders directly to Lulu
- **Status Tracking**: Monitor order progress and shipping

## Development Features

- **Mock Mode**: Test all features without API credentials
- **Type Safety**: Full TypeScript coverage
- **Component Library**: Reusable UI components
- **Error Handling**: Comprehensive error states and recovery
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components

## Project Structure

```
src/
├── components/          # UI components
│   ├── FileUpload.tsx      # Document upload
│   ├── TemplateSelector.tsx # Book format selection  
│   ├── CoverDesigner.tsx    # Cover customization
│   ├── CostCalculator.tsx   # Pricing calculation
│   └── PrintJobSubmission.tsx # Order processing
├── lib/                # Core utilities
│   ├── lulu-api.ts         # Lulu API integration
│   └── file-utils.ts       # File processing
├── types/              # TypeScript definitions
└── pages/              # Application pages
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Ready to turn your documents into professional books!** 📚✨
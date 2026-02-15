# CRM System for Service Businesses

A comprehensive Customer Relationship Management (CRM) system designed specifically for service businesses such as locksmiths, electricians, and plumbers. This application provides a complete solution for managing jobs, employees, customers, invoicing, and reporting.

## 🎯 Project Overview

This CRM system is built to streamline operations for service-based businesses by providing an all-in-one platform to manage daily operations, track performance, and handle billing efficiently.

## 🌟 Key Features

### 1. User Authentication & Company Management

- Secure login system with email and password authentication
- Users created based on roles (Owner, Employee, Customer)
- Multi-company support - users can switch between different companies
- Company-specific data isolation
- Users can create companies on the same page they select them
- Logout functionality with session management

### 2. Dashboard

The dashboard provides a comprehensive overview of business metrics:

- **Jobs Completed This X (based on filter, default month)** - Track monthly performance
- **Total Revenue This X (based on filter, default month)** - Monitor financial performance
- **Unpaid Bills This X (based on filter, default month)** - Keep track of outstanding invoices
- Quick access to all major modules

### 3. Address Search Module

Dutch address lookup functionality with comprehensive customer information:

- **Zipcode + House Number Lookup** - Quick address validation using Dutch postal codes using the API of https://www.postcode.nl/
- **Full Address Details** - Complete address information display
- **Customer Job History** - View all jobs associated with a specific address
- **Previous Job Reference** - Access historical data for returning customers

### 4. Employee Management

Comprehensive employee tracking and management:

- **Employee List View** - Overview of all employees with key information
- **Detailed Employee Profiles** including:
    - Personal information (name, email, phone, role)
    - Join date and employment history
    - Complete job history with dates and descriptions
    - Revenue tracking per employee
    - Total jobs completed
- **Employee Creation Form** - Add new employees with:
    - Name, email, phone number
    - Role/position
    - Join date
    - Company assignment

### 5. Jobs Management

Complete job lifecycle management:

#### Job List View

- Comprehensive job listing with filtering options
- Filter by:
    - Payment status (Paid/Unpaid)
    - Employee assignment
    - Date range
- Sort functionality for better organization
- Quick view of job status and key details

#### Detailed Job Pages

Each job includes:

- **Job Information:**
    - Description
    - Invoice number
    - Price and date
    - Payment status
- **Customer Details:**
    - Full contact information
    - Complete address
- **Assigned Employee:**
    - Employee name and role
    - Contact information
- **Invoice Management:**
    - View all invoices associated with the job
    - Create customer invoices
    - Create employee invoices
    - Send invoices via email
- **WhatsApp Integration:**
    - Send job details to assigned employee
    - Instant notification with complete job information
- **Payment Tracking:**
    - Mark jobs as paid
    - Track payment status

#### Job Creation

Two-step job creation process:

1. **Address Lookup:**
    - Enter Dutch zipcode and house number
    - Automatic address validation
    - Auto-fill customer details if existing customer

2. **Job Details Entry:**
    - Customer information (name, phone, email)
    - Job description
    - Price
    - Employee assignment

**Two Submit Options:**

- **Create Job** - Simply create the job without notifications
- **Create Job & Send Notification** - Create job and send WhatsApp notification to the assigned employee

### 6. Invoicing System

Comprehensive invoicing functionality with two invoice types:

#### Customer Invoices

- Bill customers for services rendered
- Sent directly to customer's email address
- Track invoice status (Draft, Sent, Paid)
- Include job details and pricing

#### Employee Invoices

- Pay employees for completed work
- Sent to employee's email address
- Track payment status
- Include job reference and compensation details

**Invoice Features:**

- Create draft invoices for review
- Create and send invoices immediately
- Email delivery simulation with confirmation
- Status tracking (Draft → Sent → Paid)
- Complete audit trail with creation and sent dates
- Amount customization

### 7. WhatsApp Integration

Direct communication with employees via WhatsApp Business API:

- **Job Assignment Notifications:**
    - Automatic formatting of job details
    - Customer information included
    - Address and contact details
    - Job pricing and scheduling
- **Two Integration Points:**
    - During job creation (optional)
    - From job details page (anytime)
- **Message Format Includes:**
    - Job ID and description
    - Customer name and contact
    - Full address
    - Date and pricing
    - Action request for employee

**WhatsApp API Implementation:**

- Mock API integration for demonstration
- Console logging of API calls
- Phone number validation
- Message formatting
- Success confirmation with toast notifications

### 8. Reports Module

Advanced reporting and analytics with multiple report types:

#### Available Reports:

1. **Revenue by Employee** - Track which employees generate the most revenue
2. **Jobs by Status** - Monitor paid vs unpaid jobs
3. **Monthly Revenue** - Analyze revenue trends over time
4. **Customer Jobs** - See job distribution across customers
5. **Employee Performance** - Compare employee productivity

**Report Features:**

- Interactive filtering options
- Sorting capabilities
- Data visualization
- Export-ready formats
- Period-based analysis

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18.3.1** - Modern UI library
- **TypeScript** - Type-safe development
- **React Router 7** - Client-side routing and navigation
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Vite** - Build tool and development server

### State Management

- **React Context API** - Global state management
- **AppContext** provides:
    - User authentication state
    - Company selection
    - Employees data
    - Customers data
    - Jobs data
    - Invoices data
    - CRUD operations for all entities
    - WhatsApp integration methods
    - Invoice management functions

### Data Models

#### User

```typescript
{
    id: string;
    email: string;
    password: string;
    name: string;
}
```

#### Company

```typescript
{
    id: string;
    name: string;
    industry: string;
}
```

#### Employee

```typescript
{
    id: string;
    companyId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    joinDate: string;
}
```

#### Customer

```typescript
{
    id: string;
    companyId: string;
    name: string;
    phone: string;
    email: string;
    zipCode: string;
    houseNumber: string;
    street: string;
    city: string;
}
```

#### Job

```typescript
{
    id: string;
    companyId: string;
    customerId: string;
    employeeId: string;
    description: string;
    price: number;
    isPaid: boolean;
    date: string;
    invoiceNumber: string;
}
```

#### Invoice

```typescript
{
  id: string;
  jobId: string;
  type: 'customer' | 'employee';
  recipientEmail: string;
  recipientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  sentAt?: string;
}
```

## 💡 Usage Guide

### Getting Started

1. **Login** using the demo credentials
2. **Select a Company** from the available options
3. **Explore the Dashboard** to see overview metrics
4. Navigate through different modules using the sidebar

### Creating a New Job

1. Navigate to **Jobs** → **Create Job**
2. Enter customer's **zipcode** and **house number**
3. Click **"Look up Address"**
4. Fill in customer details (auto-filled if existing customer)
5. Enter job description and price
6. Assign an employee
7. Choose to either:
    - **Create Job** - Save without notifications
    - **Create Job & Send Notification** - Save and notify employee via WhatsApp

### Managing Invoices

1. Open a **Job Details** page
2. Click **"Create Invoice"** button
3. Select invoice type:
    - **Customer Invoice** - Bill the customer
    - **Employee Invoice** - Pay the employee
4. Verify recipient details
5. Adjust amount if needed
6. Choose to:
    - **Create Draft** - Save for later
    - **Create & Send** - Create and email immediately

### Sending Jobs to Employees

1. Open a **Job Details** page
2. Navigate to the **"Send Job to Employee"** section
3. Click **"Send via WhatsApp"**
4. Employee receives formatted WhatsApp message with all job details
5. Confirmation toast appears with success message

### Viewing Reports

1. Navigate to **Reports** module
2. Browse available report types
3. Click on a report to view details
4. Use filters and sorting to analyze data
5. Review visualized data and metrics

## 🔧 Configuration

### Mock Data

The application uses comprehensive mock data for demonstration purposes. All data is stored in `/src/app/data/mockData.ts` and includes:

- 1 demo user account
- 3 companies (Locksmith, Electrician, Plumber)
- 4 employees across different companies
- 4 customers with Dutch addresses
- 8 sample jobs with various statuses
- 8 sample invoices (customer invoices)

### API Integration

The application is structured to easily integrate with real APIs:

- **WhatsApp Business API** - Have a connection to a whatsapp business API to send messages from the company's phone number
- **WhatsApp Business Connection** - Companies have to input their phone number somewhere and the application should guide them to connect it to the business API for seamless integration
- **Email Service** - Integrate with email provider for invoice delivery
- **Backend API** - Replace mock data with API calls
- **Dutch Address Validation API** - Integrate real postal code lookup service

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:

- Desktop computers (1920px and above)
- Laptops (1366px - 1919px)
- Tablets (768px - 1365px)
- Mobile devices (320px - 767px)

## 🔒 Security Considerations

**Note:** This is a demonstration application with mock data. For production use, implement:

- Secure authentication (JWT, OAuth)
- Password hashing (bcrypt)
- API key management for WhatsApp
- Email service authentication
- HTTPS encryption
- CORS configuration
- Input validation and sanitization
- XSS protection
- CSRF tokens

## 🎨 UI/UX Features

- **Clean, Professional Interface** - Modern design with intuitive navigation
- **Toast Notifications** - Real-time feedback for all actions
- **Loading States** - Smooth transitions and user feedback
- **Form Validation** - Client-side validation for all inputs
- **Responsive Cards** - Information displayed in organized, scannable cards
- **Status Indicators** - Color-coded badges for quick status identification
- **Interactive Elements** - Hover states and smooth transitions
- **Modal Dialogs** - Non-intrusive forms and confirmations

### Potential Features:

1. **Real-time Updates** - WebSocket integration for live data
2. **Calendar View** - Schedule jobs on a calendar
3. **SMS Notifications** - Additional notification channel
4. **Document Management** - Upload and store job-related documents
5. **Time Tracking** - Track employee hours per job
6. **Inventory Management** - Track parts and materials
7. **Customer Portal** - Allow customers to view their jobs and invoices
8. **Mobile App** - Native iOS and Android applications
9. **Advanced Analytics** - More detailed reporting and insights
10. **Payment Integration** - Accept online payments (Stripe, PayPal)
11. **Route Optimization** - Optimize employee routes for multiple jobs
12. **Customer Feedback** - Collect and display customer reviews

### API Integrations:

- **WhatsApp Business API** - Production messaging
- **Email Service** (SendGrid, Mailgun) - Automated invoice delivery
- **Dutch Address API** - Real postal code validation
- **Accounting Software** - QuickBooks, Xero integration
- **Payment Processors** - Stripe, Mollie, iDEAL
- **SMS Gateway** - Twilio, MessageBird
- **Cloud Storage** - AWS S3, Google Cloud Storage for documents

## 📊 Performance

- **Bundle Size** - Optimized with code splitting
- **Load Time** - Fast initial load with lazy loading
- **Responsive** - 60fps animations and transitions
- **Accessibility** - WCAG 2.1 compliant components

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

**Built with ❤️ for Service Businesses**

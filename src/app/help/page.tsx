"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  Search,
  Users,
  Building,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  Bell,
  Wrench,
  ChevronDown,
  ChevronRight,
  Play,
  Download
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface GuideItem {
  title: string;
  description: string;
  icon: any;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

function HelpPage() {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const guides: GuideItem[] = [
    {
      title: "Getting Started with QAPT",
      description: "Learn the basics of navigating and setting up your property management system",
      icon: BookOpen,
      duration: "10 min",
      difficulty: "Beginner"
    },
    {
      title: "Adding Your First Property",
      description: "Step-by-step guide to adding properties and units to your portfolio",
      icon: Building,
      duration: "15 min",
      difficulty: "Beginner"
    },
    {
      title: "Managing Tenants & Contacts",
      description: "How to add tenants, track contact information, and manage relationships",
      icon: Users,
      duration: "12 min",
      difficulty: "Beginner"
    },
    {
      title: "Creating and Managing Leases",
      description: "Complete guide to lease creation, terms, and ongoing management",
      icon: FileText,
      duration: "20 min",
      difficulty: "Intermediate"
    },
    {
      title: "Financial Tracking & Reporting",
      description: "Set up rent collection, expense tracking, and generate financial reports",
      icon: DollarSign,
      duration: "18 min",
      difficulty: "Intermediate"
    },
    {
      title: "Maintenance Management",
      description: "Track maintenance requests, schedule work, and manage service providers",
      icon: Wrench,
      duration: "15 min",
      difficulty: "Intermediate"
    },
    {
      title: "Calendar & Scheduling",
      description: "Use the calendar system for appointments, reminders, and important dates",
      icon: Calendar,
      duration: "10 min",
      difficulty: "Beginner"
    },
    {
      title: "Advanced Settings & Customization",
      description: "Customize your workspace, set preferences, and configure advanced features",
      icon: Settings,
      duration: "25 min",
      difficulty: "Advanced"
    }
  ];

  const faqs: FAQItem[] = [
    {
      question: "How do I add a new property to my portfolio?",
      answer: "Navigate to Properties > Add Property. Fill in the basic information like address, type, and description. You can then add units, features, and specifications in the detailed view.",
      category: "Properties"
    },
    {
      question: "Can I track multiple units within a single property?",
      answer: "Yes! QAPT supports multi-unit properties. After creating a property, you can add individual units with their own specifications, rent amounts, and tenant assignments.",
      category: "Properties"
    },
    {
      question: "How do I create a lease agreement?",
      answer: "Go to Leases > Create Lease. Select the property/unit, tenant, lease terms, and rent details. The system will generate a lease document that you can customize and send for signature.",
      category: "Leases"
    },
    {
      question: "Can I track rent payments and late fees?",
      answer: "Absolutely! The Finances section allows you to record rent payments, track late fees, and generate payment reports. You can also set up automatic reminders for due dates.",
      category: "Finances"
    },
    {
      question: "How do I manage maintenance requests?",
      answer: "Use the Maintenance section to create work orders, assign them to service providers, track progress, and record completion. You can also attach photos and documents.",
      category: "Maintenance"
    },
    {
      question: "Can I generate financial reports?",
      answer: "Yes! QAPT provides various financial reports including income statements, expense tracking, rent rolls, and tax reports. Access these through the Finances > Reports section.",
      category: "Finances"
    },
    {
      question: "How do I set up notifications and reminders?",
      answer: "Go to Settings > Notifications to configure email and in-app notifications for rent due dates, lease expirations, maintenance schedules, and other important events.",
      category: "Settings"
    },
    {
      question: "Can I invite team members to collaborate?",
      answer: "Yes! In Settings > User Access & Roles, you can invite team members and assign different permission levels (Admin, Manager, Viewer) based on their responsibilities.",
      category: "Settings"
    },
    {
      question: "How do I backup my data?",
      answer: "QAPT automatically backs up your data to secure cloud storage. You can also export your data anytime through Settings > Data Export for additional backup or migration purposes.",
      category: "Settings"
    },
    {
      question: "What file formats can I upload for documents?",
      answer: "QAPT supports common file formats including PDF, DOC, DOCX, JPG, PNG, and more. Maximum file size is 10MB per document. All files are securely stored and encrypted.",
      category: "Documents"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-700";
      case "Intermediate": return "bg-yellow-100 text-yellow-700";
      case "Advanced": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Help & Support</h1>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              User Manual
            </Button>
            <Button size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="guides">Video Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Start Card */}
              <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Get up and running with QAPT in just a few minutes. Follow these essential steps to set up your property management system.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                          <div>
                            <h4 className="font-medium">Complete Your Profile</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Set up your account information and preferences</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                          <div>
                            <h4 className="font-medium">Add Your First Property</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Create property records with units and details</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                          <div>
                            <h4 className="font-medium">Import or Add Tenants</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Set up your tenant database and contact information</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                          <div>
                            <h4 className="font-medium">Create Lease Agreements</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Set up active leases with terms and rent details</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</div>
                          <div>
                            <h4 className="font-medium">Configure Notifications</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Set up alerts for rent, maintenance, and important dates</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">6</div>
                          <div>
                            <h4 className="font-medium">Explore the Dashboard</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Familiarize yourself with the main interface and features</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button className="w-full md:w-auto">
                        <Play className="h-4 w-4 mr-2" />
                        Start Setup Wizard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Features Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Property & Unit Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Tenant & Contact Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Lease Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Financial Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Maintenance Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Calendar & Scheduling</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Notifications & Alerts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips Section */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Pro Tips for Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Start Small</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Begin with one property to familiarize yourself with the system before adding your entire portfolio.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Use Templates</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Take advantage of lease templates and document templates to save time on repetitive tasks.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Set Up Notifications</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Configure email and in-app notifications early to stay on top of important dates and tasks.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Regular Backups</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        While QAPT auto-backs up your data, consider periodic exports for your own records.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide, index) => {
                const IconComponent = guide.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <Badge className={getDifficultyColor(guide.difficulty)} variant="outline">
                              {guide.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {guide.duration}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold mb-2">{guide.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {guide.description}
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Guide
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* FAQ Categories */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(new Set(faqs.map(faq => faq.category))).map((category) => (
                      <button
                        key={category}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ List */}
              <div className="lg:col-span-3 space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-0.5">
                              {faq.category}
                            </Badge>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {faq.question}
                            </h3>
                          </div>
                          {expandedFAQ === index ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contact Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help from our support team for technical issues or questions about using QAPT.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Live Chat
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📧 support@qapt.com</p>
                    <p>⏰ Mon-Fri, 9AM-6PM EST</p>
                    <p>🕐 Response time: 2-4 hours</p>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Speak directly with our support team for urgent issues or complex problems.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      Schedule Callback
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📞 1-800-QAPT-HELP</p>
                    <p>⏰ Mon-Fri, 8AM-8PM EST</p>
                    <p>🌍 International: +1-555-123-4567</p>
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Additional resources and documentation to help you get the most out of QAPT.
                  </p>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Knowledge Base
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      User Manual (PDF)
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Video Tutorials
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Community Forum
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">All Systems Operational</span>
                    </div>
                    <p className="text-xs text-gray-500">Last updated: 2 minutes ago</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">99.9% Uptime</span>
                    </div>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Status Page
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Requests */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Feature Requests & Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Have an idea for a new feature or improvement? We'd love to hear from you!
                  </p>
                  <div className="flex gap-3">
                    <Button>
                      Submit Feature Request
                    </Button>
                    <Button variant="outline">
                      View Roadmap
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default withAuth(HelpPage);

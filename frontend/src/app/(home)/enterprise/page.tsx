'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/home/section-header';
import { FooterSection } from '@/components/home/sections/footer-section';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Check, 
  Clock, 
  Shield, 
  Users, 
  Zap,
  Star,
  Calendar,
  Headphones,
  Settings,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdenticEnterpriseModal } from '@/components/sidebar/kortix-enterprise-modal';
import { AdenticLogo } from '@/components/sidebar/kortix-logo';

// Hero Section Component
const CustomHeroSection = () => {
  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 pt-32 mx-auto h-full w-full max-w-6xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 pt-12 max-w-4xl mx-auto">
            {/* Adentic Logo */}
            <div className="mb-8">
              <AdenticLogo size={48} />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Enterprise Multi-Agent Systems</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tighter text-balance text-center">
              <span className="text-primary">Enterprise Automation.</span>
              <br />
              <span className="text-secondary">Teams of agents, deployed in days.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-3xl">
              Transform your operations with custom multi-agent systems. Our specialists design, develop and deploy enterprise-grade teams of specialized AI agents that integrate seamlessly with your existing tech stack—Shopify, Stripe, HubSpot, TikTok, and 100+ more.
            </p>
            
            <div className="flex flex-col items-center gap-6 pt-6">
              <AdenticEnterpriseModal>
                <Button size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Marketing Strategy Call
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </AdenticEnterpriseModal>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Free marketing audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Custom automation design</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>ROI-focused pricing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-16 sm:mt-32 mx-auto"></div>
      </div>
    </section>
  );
};

// Value Proposition Section
const ValuePropSection = () => {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              When Off-the-Shelf Automation Falls Short
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Custom multi-agent systems designed for enterprise teams with complex workflows, multi-channel operations, and mission-critical business processes. Teams of specialized agents working together for reliability and scale.
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
            <div className="p-8 border-r border-border">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Accelerate Business ROI</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bypass months of automation setup and optimization cycles. Our proven methodology delivers enterprise-ready multi-agent systems in weeks, letting you focus on strategy instead of technical implementation.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Complete Stack Integration</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Designed for complex business ecosystems requiring seamless integration with e-commerce platforms (Shopify), payment systems (Stripe), CRM tools (HubSpot), social platforms (TikTok), and 100+ other tools. Teams of agents coordinate across your entire stack.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Implementation Process Section
const ProcessSection = () => {
  const steps = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Business Strategy Analysis",
      description: "Specialists conduct comprehensive workflow analysis, process mapping, and technical requirements gathering to design optimal multi-agent architecture. We identify which teams of agents (Marketing, Finance, Operations, Growth) you need and how they'll coordinate.",
      phase: "Discovery"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Multi-Agent System Development", 
      description: "Full-stack development of teams of specialized agents with enterprise security, scalability design, comprehensive testing, performance optimization, and seamless integration with your entire tech stack—Shopify, Stripe, HubSpot, TikTok, and more.",
      phase: "Build"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Success Management",
      description: "Dedicated success management, comprehensive team training programs, continuous monitoring of agent teams, optimization services, and ROI guarantee with full accountability. Multiple agents per function ensure reliability.",
      phase: "Scale"
    }
  ];

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Our Multi-Agent System Methodology
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              A proven three-phase approach that transforms your business vision into production-ready teams of specialized agents
            </p>
          </SectionHeader>

          <div className="border-t border-border">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`flex flex-col md:flex-row gap-8 p-8 ${index !== steps.length - 1 ? 'border-b border-border' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary border border-primary/20">
                    {step.icon}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <span className="px-3 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full">
                      {step.phase}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Benefits Section
const BenefitsSection = () => {
  const benefits = [
    "Dedicated multi-agent system specialist and technical lead for your project",
    "Enterprise-grade multi-agent architecture with teams of agents for redundancy and reliability",
    "White-glove support with dedicated success manager", 
    "Comprehensive team training on managing and optimizing agent teams",
    "Quarterly performance reviews and agent team optimization",
    "Deep integration with existing tech stack—Shopify, Stripe, HubSpot, TikTok, and 100+ tools"
  ];

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Enterprise Multi-Agent Systems
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Premium service tier with dedicated resources and tailored multi-agent solutions for complex business operations. Teams of specialized agents working together for maximum reliability and scale.
            </p>
          </SectionHeader>

          <div className="border-t border-border p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg hover:bg-accent/20 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "The marketing automation team transformed our entire campaign workflow. Their expertise in enterprise marketing deployment is unmatched.",
      author: "Sarah Chen",
      company: "TechFlow Marketing",
      avatar: "🚀"
    },
    {
      quote: "Marketing ROI was evident within the first month. The automation handles our most complex campaigns flawlessly.",
      author: "Marcus Rodriguez", 
      company: "Global Marketing Corp",
      avatar: "💡"
    },
    {
      quote: "Outstanding marketing expertise and technical depth. They delivered exactly what our marketing team envisioned.",
      author: "Dr. Amanda Foster",
      company: "Research Marketing LLC",
      avatar: "⭐"
    },
    {
      quote: "Professional, reliable, and innovative. The custom marketing solution exceeded our expectations completely.",
      author: "James Wellington",
      company: "Strategic Marketing Group", 
      avatar: "🎯"
    }
  ];

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Marketing Success Stories
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Marketing teams that have transformed their operations with our enterprise automation services
            </p>
          </SectionHeader>

          <div className="border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className={`p-8 ${index % 2 === 0 ? 'md:border-r border-border' : ''} ${index < 2 ? 'border-b border-border' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    
                    <blockquote className="text-lg font-medium leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Self-Service Alternative Section
const SelfServiceSection = () => {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Self-Service Alternative
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Explore our platform independently with comprehensive resources and community support
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
            <div className="p-8 border-r border-border space-y-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Learning Center</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Master AI worker development through structured courses, detailed documentation, and hands-on tutorials.
                </p>
                <Button variant="outline" className="rounded-full">
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Developer Community</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Connect with engineers, solution architects, and other professionals building enterprise AI solutions.
                </p>
                <Button variant="outline" className="rounded-full">
                  Join Community
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTASection = () => {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Let's discuss your specific business requirements and design a custom multi-agent system strategy with teams of specialized agents for your organization.
            </p>
          </SectionHeader>

          <div className="border-t border-border p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="space-y-6">
                  <AdenticEnterpriseModal>
                    <Button size="lg">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Your Strategy Session
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </AdenticEnterpriseModal>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Shield className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">ROI Guarantee</span>
                      <span className="text-xs text-muted-foreground">Business results</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Users className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Dedicated Support</span>
                      <span className="text-xs text-muted-foreground">Expert team</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Settings className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Custom Pricing</span>
                      <span className="text-xs text-muted-foreground">Based on ROI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Page Component
export default function CustomImplementationPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="w-full divide-y divide-border">
        <CustomHeroSection />
        <ValuePropSection />
        <ProcessSection />
        <BenefitsSection />
        {/* <TestimonialsSection /> */}
        {/* <SelfServiceSection /> */}
        <FinalCTASection />
        <FooterSection />
      </div>
    </main>
  );
}

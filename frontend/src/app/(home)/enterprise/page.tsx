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
              <span className="text-sm font-medium text-primary">Team Edition for Scaling Brands</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tighter text-balance text-center">
              <span className="text-primary">Built for brands scaling from $1M to $10M.</span>
              <br />
              <span className="text-secondary">Without the bloat.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-3xl">
              Adentic Team Edition gives your lean team (5-20 people) the operational leverage of a 50-person company. A <span className="font-semibold text-foreground">team of specialized AI agents</span> working alongside your team. Built for collaboration.
            </p>
            
            <div className="flex flex-col items-center gap-6 pt-6">
              <AdenticEnterpriseModal>
                <Button size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Team Strategy Call
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </AdenticEnterpriseModal>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Free operations audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Custom team workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Scale-based pricing</span>
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
              When Your Team Needs More Than Solo Mode
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Built for scaling brands with lean teams who need enterprise-level operations without enterprise-level headcount.
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
            <div className="p-8 border-r border-border">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Multiply Team Output</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your 5-person team operates like 20. A team of AI agents handles the operational grind across ads, customer support, inventory, and analytics—so your team focuses on growth strategy.
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
                  <h3 className="text-xl font-semibold mb-3">Built for Collaboration</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Team permissions, shared workflows, and collaborative decision-making. Everyone on your team can leverage the agent team's power while maintaining control and visibility over each specialized agent.
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
      title: "Team Operations Analysis",
      description: "Our specialists work with your team to map workflows, identify bottlenecks, and design an autonomous system tailored to your brand's operations and growth goals.",
      phase: "Discovery"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Custom Team Deployment", 
      description: "We configure Adentic for your team's specific needs—permissions, workflows, integrations, and collaboration features—with full training and onboarding support.",
      phase: "Build"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Dedicated Growth Strategist",
      description: "Your team gets a dedicated growth strategist for ongoing optimization, quarterly reviews, and strategic guidance as you scale from $1M to $10M+.",
      phase: "Scale"
    }
  ];

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              How Team Edition Works
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              A proven three-phase approach that transforms your team's operations into a scalable, autonomous system
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
    "Dedicated growth strategist and technical lead for your team",
    "Custom team workflows with role-based permissions and collaboration features",
    "White-glove onboarding with comprehensive team training", 
    "Priority support with dedicated Slack channel for your team",
    "Quarterly strategy reviews and operations optimization",
    "Deep integration with your existing operations stack (Shopify, Stripe, HubSpot, etc.)"
  ];

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Team Edition Benefits
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Premium tier with dedicated support, custom workflows, and strategic guidance for scaling brands
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
              Ready to Scale Your Team's Impact?
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Let's discuss how Adentic Team Edition can give your lean team enterprise-level operational leverage.
            </p>
          </SectionHeader>

          <div className="border-t border-border p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="space-y-6">
                  <AdenticEnterpriseModal>
                    <Button size="lg">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Your Team Strategy Session
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </AdenticEnterpriseModal>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Shield className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Growth Guarantee</span>
                      <span className="text-xs text-muted-foreground">Scale with confidence</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Users className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Dedicated Strategist</span>
                      <span className="text-xs text-muted-foreground">Your growth partner</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/20">
                      <Settings className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Custom Workflows</span>
                      <span className="text-xs text-muted-foreground">Built for your team</span>
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

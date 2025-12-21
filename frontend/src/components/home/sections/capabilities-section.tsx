'use client';

import { SectionHeader } from '@/components/home/section-header';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { 
  TrendingUp,
  Shield,
  MessageSquare,
  Target
} from 'lucide-react';

const scenarios = [
  {
    number: '01',
    title: 'Margin Guard',
    when: "Ad costs spike, eating your profit.",
    adenticDoes: "Spots the bleed, pauses bad spend, re-routes budget to profitable channels.",
    result: "Your margins stay protected 24/7.",
    icon: <Shield className="size-6" />,
  },
  {
    number: '02',
    title: 'Support Storm',
    when: "Shipping delay hits 50 customers.",
    adenticDoes: "Finds affected orders, issues credits, sends apology emails.",
    result: "Crisis becomes loyalty—automatically.",
    icon: <MessageSquare className="size-6" />,
  },
  {
    number: '03',
    title: 'Hidden Gem',
    when: "Product sells unusually well in one region.",
    adenticDoes: "Flags the opportunity, suggests local warehouse to cut costs.",
    result: "You scale where the money is.",
    icon: <Target className="size-6" />,
  },
  {
    number: '04',
    title: 'Competitor Pivot',
    when: "Competitor's video goes viral at 2 AM.",
    adenticDoes: "Detects trend, adapts hook to your voice, drafts counter-ads.",
    result: "You never miss a market shift.",
    icon: <TrendingUp className="size-6" />,
  },
];

export function CapabilitiesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      id="scenarios"
      className="flex flex-col items-center justify-center w-full relative"
      ref={ref}
    >
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Things you no longer have to do.
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              A team of specialized agents handles the operational chaos so you can focus on building your brand.
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: 'easeOut',
                }}
                className="relative p-8 border-border group hover:bg-accent/5 transition-colors duration-300 [&:nth-child(odd)]:border-r [&:nth-child(-n+2)]:border-b"
              >
                {/* Number Badge */}
                <div className="absolute top-6 right-6 flex items-center justify-center size-12 bg-primary/10 rounded-full">
                  <span className="text-lg font-bold text-primary">{scenario.number}</span>
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center size-14 bg-secondary/10 rounded-xl mb-4 group-hover:bg-secondary/20 transition-colors duration-300">
                  <div className="text-secondary">
                    {scenario.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {scenario.title}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">When:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scenario.when}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Adentic Does:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scenario.adenticDoes}
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm font-semibold text-primary">
                        Result: {scenario.result}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

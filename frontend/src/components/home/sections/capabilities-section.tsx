'use client';

import { SectionHeader } from '@/components/home/section-header';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { 
  TrendingUp,
  Shield,
  Headphones,
  Sparkles
} from 'lucide-react';

const scenarios = [
  {
    number: '01',
    title: 'The Competitor Pivot',
    when: 'A competitor\'s video goes viral at 2 AM with a new hook.',
    adenticDoes: 'Your Marketing Team (multiple agents working together) detects the viral trend, adapts the hook to your brand voice, and drafts counter-ads for your approval before you wake up.',
    result: 'You never miss a market shift.',
    icon: <TrendingUp className="size-6" />,
  },
  {
    number: '02',
    title: 'The Margin Guard',
    when: 'Your ad costs (CPM) spike unexpectedly on a Tuesday, eating your profit.',
    adenticDoes: 'Your Finance Team (a coordinated group of agents) instantly spots the bleed, pauses the bad spend, and re-routes the budget to your most profitable channels.',
    result: 'Your bank account is protected automatically.',
    icon: <Shield className="size-6" />,
  },
  {
    number: '03',
    title: 'The Support Storm',
    when: 'A shipping delay affects 50 customers in London.',
    adenticDoes: 'Your Operations Team (agents working in parallel) identifies the affected orders in Shopify, issues proactive credits in Stripe, and sends personal apology emails via HubSpot.',
    result: 'A crisis becomes a loyalty moment without you typing a word.',
    icon: <Headphones className="size-6" />,
  },
  {
    number: '04',
    title: 'The Hidden Gem',
    when: 'A specific product starts selling unusually well in a specific region.',
    adenticDoes: 'Your Growth Team (agents analyzing different data points) flags the opportunity and suggests moving inventory to a local warehouse to cut shipping costs and speed up delivery.',
    result: 'You scale exactly where the money is.',
    icon: <Sparkles className="size-6" />,
  },
];

export function CapabilitiesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      id="capabilities"
      className="flex flex-col items-center justify-center w-full relative"
      ref={ref}
    >
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Things you no longer have to do
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Success shouldn't turn you into a middle manager. You started a brand to create products—to sell the best socks, protein bars, or gear on the market. But once you start scaling, the "Owner's Trap" sets in. Instead of building, you're stuck "gluing" apps together. You're manually auditing Stripe refunds, guessing which TikTok creative is working, and worrying about inventory. You are the bottleneck. Stop being the machine. Start being the owner.
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15,
                  ease: 'easeOut',
                }}
                className="relative p-8 border-border group hover:bg-accent/5 transition-colors duration-300 [&:not(:nth-child(2n))]:border-r [&:not(:nth-last-child(-n+2))]:border-b"
              >
                {/* Number and Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center size-12 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors duration-300">
                    <div className="text-secondary">
                      {scenario.icon}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground/50">{scenario.number}</span>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {scenario.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">When:</p>
                    <p className="text-sm leading-relaxed">{scenario.when}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Adentic Does:</p>
                    <p className="text-sm leading-relaxed">{scenario.adenticDoes}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary mb-1">Result:</p>
                    <p className="text-sm font-medium leading-relaxed">{scenario.result}</p>
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

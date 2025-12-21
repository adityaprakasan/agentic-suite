'use client';

import { SectionHeader } from '@/components/home/section-header';
import { FirstBentoAnimation } from '@/components/home/first-bento-animation';
import { SecondBentoAnimation } from '@/components/home/second-bento-animation';
import { ThirdBentoAnimation } from '@/components/home/third-bento-animation';
export function BentoSection() {
  const bentoItems = [
    {
      id: 1,
      content: <FirstBentoAnimation />,
      title: 'Specialized Teams',
      description:
        'Multiple agents per function—your Marketing Team, Finance Team, Operations Team. Each team has several agents working together for reliability and redundancy.',
    },
    {
      id: 2,
      content: <SecondBentoAnimation />,
      title: 'Coordinated Execution',
      description:
        'Agents within each team communicate and collaborate seamlessly. Teams of agents connect to different apps simultaneously—your Marketing Team talks to TikTok, your Finance Team monitors Stripe, your Operations Team manages Shopify.',
    },
    {
      id: 3,
      content: <ThirdBentoAnimation />,
      title: 'Built-in Redundancy',
      description:
        'Multiple agents mean reliability. If one agent encounters an issue or is busy, the team continues working seamlessly. Nothing breaks, nothing slips through.',
    },
  ];

  return (
    <section
      id="process"
      className="flex flex-col items-center justify-center w-full relative"
    >
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Teams of Agents, Working Together
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Adentic doesn't ask you to build workflows or connect nodes. It inhabits the stack you already use. Whether it's Shopify for sales, Stripe for refunds, HubSpot for retention, or TikTok for growth—teams of agents act as the connective tissue that makes them work as one.
            </p>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 overflow-hidden border-t">
          {bentoItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-start justify-end min-h-[600px] md:min-h-[500px] p-0.5 relative before:absolute before:-left-0.5 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-0.5 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] group cursor-pointer max-h-[400px] group"
            >
              <div className="relative flex size-full items-center justify-center h-full overflow-hidden">
                {item.content}
              </div>
              <div className="flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg tracking-tighter font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

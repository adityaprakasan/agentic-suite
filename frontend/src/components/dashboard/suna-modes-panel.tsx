'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon,
  Presentation,
  BarChart3,
  ArrowUpRight,
  FileText,
  Search,
  Users,
  RefreshCw,
  Check,
  Table,
  LayoutDashboard,
  FileBarChart,
  X,
  Eye,
  Loader2,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPdfUrl } from '@/components/thread/tool-views/utils/presentation-utils';
import { PromptExamples } from '@/components/shared/prompt-examples';

interface SunaModesPanelProps {
  selectedMode: string | null;
  onModeSelect: (mode: string | null) => void;
  onSelectPrompt: (prompt: string) => void;
  isMobile?: boolean;
  selectedCharts?: string[];
  onChartsChange?: (charts: string[]) => void;
  selectedOutputFormat?: string | null;
  onOutputFormatChange?: (format: string | null) => void;
  selectedTemplate?: string | null;
  onTemplateChange?: (template: string | null) => void;
}

type ModeType = 'image' | 'slides' | 'data' | 'docs' | 'people' | 'research';

// Support both simple string prompts (backward compatibility) and prompt objects with short/long
type PromptItem = string | { short: string; long: string };

interface Mode {
  id: ModeType;
  label: string;
  icon: React.ReactNode;
  samplePrompts: PromptItem[];
  options?: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      image?: string;
      description?: string;
    }>;
  };
  chartTypes?: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
}

const modes: Mode[] = [
  {
    id: 'image',
    label: 'Image',
    icon: <ImageIcon className="w-4 h-4" />,
    samplePrompts: [
      'A majestic golden eagle soaring through misty mountain peaks at sunrise with dramatic lighting',
      'Close-up portrait of a fashion model with avant-garde makeup, studio lighting, high contrast shadows',
      'Cozy Scandinavian living room with natural wood furniture, indoor plants, and soft morning sunlight',
      'Futuristic cyberpunk street market at night with neon signs, rain-slicked pavement, and holographic displays',
      'Elegant product photography of luxury perfume bottle on marble surface with soft reflections',
      'Whimsical floating islands connected by rope bridges in a pastel sky with dreamy clouds',
      'Macro close-up of morning dew drops on vibrant flower petals with bokeh background',
      'Modern workspace desk setup with laptop, coffee, notebook, and succulent plants from above',
      'Mystical forest path with ancient trees, glowing fireflies, and ethereal light beams through fog',
      'Architectural detail of contemporary glass building facade with geometric patterns and reflections',
      'Vibrant street food vendor stall with colorful ingredients, steam rising, and warm lighting',
      'Serene Japanese zen garden with raked sand, moss-covered stones, and cherry blossom petals',
      'Dynamic action shot of athlete mid-jump against dramatic sunset sky, silhouette effect',
      'Rustic farmhouse kitchen with copper pots, fresh herbs, wooden cutting boards, and natural textures',
      'Abstract fluid art with swirling metallic gold, deep blue, and emerald green organic patterns',
    ],
    options: {
      title: 'Choose a style',
      items: [
        { id: 'photorealistic', name: 'Photorealistic', image: '/images/image-styles/photorealistic_eagle-min.png' },
        { id: 'watercolor', name: 'Watercolor', image: '/images/image-styles/watercolor_garden-min.png' },
        { id: 'digital-art', name: 'Digital Art', image: '/images/image-styles/digital_art_cyberpunk-min.png' },
        { id: 'oil-painting', name: 'Oil Painting', image: '/images/image-styles/oil_painting_villa-min.png' },
        { id: 'minimalist', name: 'Minimalist', image: '/images/image-styles/minimalist_coffee-min.png' },
        { id: 'isometric', name: 'Isometric', image: '/images/image-styles/isometric_bedroom-min.png' },
        { id: 'vintage', name: 'Vintage', image: '/images/image-styles/vintage_diner-min.png' },
        { id: 'comic', name: 'Comic Book', image: '/images/image-styles/comic_book_robot-min.png' },
        { id: 'neon', name: 'Neon', image: '/images/image-styles/neon_jellyfish-min.png' },
        { id: 'pastel', name: 'Pastel', image: '/images/image-styles/pastel_landscape-min.png' },
        { id: 'geometric', name: 'Geometric', image: '/images/image-styles/geometric_crystal-min.png' },
        { id: 'abstract', name: 'Abstract', image: '/images/image-styles/abstract_organic-min.png' },
        { id: 'anime', name: 'Anime', image: '/images/image-styles/anime_forest-min.png' },
        { id: 'impressionist', name: 'Impressionist', image: '/images/image-styles/impressionist_garden-min.png' },
        { id: 'surreal', name: 'Surreal', image: '/images/image-styles/surreal_islands-min.png' },
      ],
    },
  },
  {
    id: 'slides',
    label: 'Slides',
    icon: <Presentation className="w-4 h-4" />,
    samplePrompts: [
      'Create a Series A pitch deck with market size, traction, and financial projections',
      'Build a Q4 business review showcasing KPIs, wins, and strategic initiatives',
      'Design a product launch presentation with demo videos and customer testimonials',
      'Develop a sales enablement deck explaining our value prop and competitive advantages',
      'Create an investor update highlighting key metrics and upcoming milestones',
      'Build a customer case study presentation showing ROI and success metrics',
      'Design an all-hands presentation covering company updates and vision',
      'Develop a training deck for new product features and workflows',
      'Create a conference talk about scaling engineering teams',
      'Build a board meeting presentation with strategic recommendations',
    ],
    options: {
      title: 'Choose a template',
      items: [
        { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple design', image: '/images/presentation-templates/minimalist-min.png' },
        { id: 'minimalist_2', name: 'Minimalist 2', description: 'Alternative minimal style', image: '/images/presentation-templates/minimalist_2-min.png' },
        { id: 'black_and_white_clean', name: 'Black & White', description: 'Classic monochrome', image: '/images/presentation-templates/black_and_white_clean-min.png' },
        { id: 'colorful', name: 'Colorful', description: 'Vibrant and energetic', image: '/images/presentation-templates/colorful-min.png' },
        { id: 'startup', name: 'Startup', description: 'Dynamic and innovative', image: '/images/presentation-templates/startup-min.png' },
        { id: 'elevator_pitch', name: 'Elevator Pitch', description: 'Quick and impactful', image: '/images/presentation-templates/elevator_pitch-min.png' },
        { id: 'portfolio', name: 'Portfolio', description: 'Showcase your work', image: '/images/presentation-templates/portfolio-min.png' },
        { id: 'textbook', name: 'Textbook', description: 'Educational and structured', image: '/images/presentation-templates/textbook-min.png' },
        { id: 'architect', name: 'Architect', description: 'Professional and precise', image: '/images/presentation-templates/architect-min.png' },
        { id: 'hipster', name: 'Hipster', description: 'Modern and trendy', image: '/images/presentation-templates/hipster-min.png' },
        { id: 'green', name: 'Green', description: 'Nature-inspired design', image: '/images/presentation-templates/green-min.png' },
        { id: 'premium_black', name: 'Premium Black', description: 'Luxury dark theme', image: '/images/presentation-templates/premium_black-min.png' },
        { id: 'premium_green', name: 'Premium Green', description: 'Sophisticated green', image: '/images/presentation-templates/premium_green-min.png' },
        { id: 'professor_gray', name: 'Professor Gray', description: 'Academic and scholarly', image: '/images/presentation-templates/professor_gray-min.png' },
        { id: 'gamer_gray', name: 'Gamer Gray', description: 'Gaming-inspired design', image: '/images/presentation-templates/gamer_gray-min.png' },
        { id: 'competitor_analysis_blue', name: 'Analysis Blue', description: 'Business analysis focused', image: '/images/presentation-templates/competitor_analysis_blue-min.png' },
        { id: 'numbers_clean', name: 'Numbers Clean', description: 'Clean data visualization', image: '/images/presentation-templates/numbers_clean-min.png' },
        { id: 'numbers_colorful', name: 'Numbers Colorful', description: 'Vibrant data presentation', image: '/images/presentation-templates/numbers_colorful-min.png' },
      ],
    },
  },
  {
    id: 'data',
    label: 'Data',
    icon: <BarChart3 className="w-4 h-4" />,
    samplePrompts: [
      'Build a financial model projecting ARR growth with different pricing scenarios',
      'Create an interactive sales dashboard tracking metrics by region and quarter',
      'Analyze 50K customer reviews and visualize sentiment trends over time',
      'Design a content calendar tracking campaigns with ROI and engagement charts',
      'Build a cohort analysis showing user retention and churn patterns',
      'Create a marketing attribution model comparing channel performance',
      'Develop a hiring tracker with pipeline metrics and time-to-fill analysis',
      'Build a budget planning spreadsheet with scenario modeling',
      'Analyze website traffic data and visualize conversion funnels',
      'Create an inventory management system with automated reorder alerts',
    ],
    options: {
      title: 'Choose output format',
      items: [
        { id: 'spreadsheet', name: 'Spreadsheet', description: 'Table with formulas' },
        { id: 'dashboard', name: 'Dashboard', description: 'Interactive charts' },
        { id: 'report', name: 'Report', description: 'Analysis with visuals' },
        { id: 'slides', name: 'Slides', description: 'Presentation format' },
      ],
    },
    chartTypes: {
      title: 'Preferred charts',
      items: [
        { id: 'bar', name: 'Bar', description: 'Vertical bar chart' },
        { id: 'line', name: 'Line', description: 'Line chart' },
        { id: 'pie', name: 'Pie', description: 'Pie chart' },
        { id: 'scatter', name: 'Scatter', description: 'Scatter plot' },
        { id: 'heatmap', name: 'Heat map', description: 'Heat map' },
        { id: 'bubble', name: 'Bubble', description: 'Bubble chart' },
        { id: 'wordcloud', name: 'Word cloud', description: 'Word cloud visualization' },
        { id: 'stacked', name: 'Stacked bar', description: 'Stacked bar chart' },
        { id: 'area', name: 'Area', description: 'Area chart' },
      ],
    },
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: <FileText className="w-4 h-4" />,
    samplePrompts: [
      'Write a comprehensive PRD for an AI-powered recommendation engine',
      'Draft a technical architecture document for a scalable microservices platform',
      'Create a go-to-market strategy document for our Q2 product launch',
      'Develop a 90-day onboarding playbook for engineering managers',
      'Write an API documentation guide with examples and best practices',
      'Create a company handbook covering culture, policies, and benefits',
      'Draft a data privacy policy compliant with GDPR and CCPA',
      'Develop a customer success playbook for SaaS enterprise accounts',
      'Write a security incident response plan with escalation procedures',
      'Create a comprehensive style guide for brand and content',
    ],
    options: {
      title: 'Choose a template',
      items: [
        { id: 'prd', name: 'PRD', description: 'Product requirements document' },
        { id: 'technical', name: 'Technical', description: 'Technical documentation' },
        { id: 'proposal', name: 'Proposal', description: 'Business proposal' },
        { id: 'report', name: 'Report', description: 'Detailed report format' },
        { id: 'guide', name: 'Guide', description: 'Step-by-step guide' },
        { id: 'wiki', name: 'Wiki', description: 'Knowledge base article' },
        { id: 'policy', name: 'Policy', description: 'Policy document' },
        { id: 'meeting-notes', name: 'Meeting Notes', description: 'Meeting minutes' },
      ],
    },
  },
  {
    id: 'people',
    label: 'Creator search',
    icon: <Users className="w-4 h-4" />,
    samplePrompts: [
      {
        short: 'Find macro-influencers (500K-2M followers) suitable for brand ambassador role',
        long: 'Find macro-influencers (500K-2M followers) suitable for [Brand Name] long-term brand ambassador role:\n\n- Primary platforms: TikTok, Instagram, YouTube\n- Audience demographics: [e.g., "UK women 25-50, affluent, lifestyle-focused"]\n- Content specialization: [e.g., "food, wellness, lifestyle, home"]\n- Engagement rate minimum: 2-3%\n- Audience authenticity: Verified, low bot engagement\n- Previous brand partnerships: [e.g., "luxury brands", "CPG brands", "lifestyle brands"]\n- Brand safety: [e.g., "family-friendly", "premium positioning", "eco-conscious"]\n- Content production quality: Professional/semi-professional\n- Availability: [e.g., "available for 6-12 month partnership"]\n- Geographic reach: UK-dominant or UK-significant audience\n- Estimated partnership budget: [e.g., "£5K-£20K per post"]\n\nProvide: Top 5-10 creator recommendations with full profiles, audience insights, previous campaign examples, negotiation strategy.'
      },
      {
        short: 'Identify celebrity & macro-influencer crossover candidates',
        long: 'Identify macro-influencers with celebrity status or mainstream media presence for [Brand Name]:\n\n- Follower count: 1M+ across platforms\n- Media presence: TV appearances, press coverage, podcast features\n- Audience reach: UK-wide with international appeal\n- Content categories: [e.g., "food", "lifestyle", "wellness", "entertainment"]\n- Brand partnerships: Previous work with major brands\n- Credibility: Industry expert, thought leader, or entertainment personality\n- Engagement authenticity: Real, engaged audience\n- Crossover potential: Ability to reach beyond social media\n- Campaign fit: [e.g., "product launch", "brand repositioning", "market expansion"]\n\nProvide: Celebrity/macro-influencer profiles, media reach analysis, partnership potential, estimated costs, PR value.'
      },
      {
        short: 'Search for macro-influencers dominating multiple platforms',
        long: 'Find macro-influencers who dominate multiple platforms simultaneously:\n\n- TikTok followers: 500K+\n- Instagram followers: 500K+\n- YouTube subscribers: 200K+\n- Consistent posting across all platforms\n- Audience demographics: [Target audience]\n- Content themes: [e.g., "food", "lifestyle", "wellness"]\n- Engagement rates: Above 2% on all platforms\n- Cross-platform content strategy: Repurposing and platform-specific content\n- Audience overlap: Significant audience across platforms\n- Geographic focus: UK-based or UK-dominant\n\nProvide: Multi-platform influencer profiles, cross-platform reach analysis, content strategy insights, partnership recommendations.'
      },
      {
        short: 'Search for macro-influencers available for seasonal campaigns',
        long: 'Search for macro-influencers available for seasonal campaigns:\n\n- Campaign season: [e.g., "Christmas 2025", "Summer 2025", "Easter 2025"]\n- Follower range: 500K-3M\n- Content alignment: [e.g., "festive content", "seasonal lifestyle", "holiday entertaining"]\n- Audience demographics: [Target market]\n- Campaign duration: [e.g., "4-8 weeks"]\n- Content requirements: [e.g., "5-10 posts", "mix of feed and stories", "video content"]\n- Previous seasonal campaigns: Track record with holiday/seasonal content\n- Availability confirmation: Confirmed availability during campaign period\n- Budget range: [e.g., "£10K-£30K"]\n\nProvide: Available macro-influencers, seasonal content examples, campaign recommendations, booking timeline.'
      },
      {
        short: 'Find mid-tier creators who are authentic brand advocates',
        long: 'Find mid-tier creators (100K-500K followers) who are authentic advocates for [Product Category]:\n\n- Genuine passion for [e.g., "sustainable food", "healthy eating", "family wellness"]\n- Audience alignment: [Target demographics]\n- Engagement rate: 3-5%+\n- Content authenticity: Organic, non-salesy approach\n- Community trust: Strong audience loyalty and comments\n- Previous brand partnerships: [e.g., "2-5 successful collaborations"]\n- Content quality: High production value or authentic lifestyle content\n- Posting frequency: Consistent (3-5x per week minimum)\n- Geographic focus: UK-based or UK audience\n- Partnership flexibility: Open to creative collaboration\n- Budget range: [e.g., "£1K-£5K per post"]\n\nProvide: Creator profiles, audience insights, content examples, partnership history, collaboration ideas.'
      },
      {
        short: 'Identify mid-tier creators who are niche specialists',
        long: 'Identify mid-tier creators who are specialists in specific niches:\n\n- Niche focus: [e.g., "plant-based cooking", "budget family meals", "zero-waste living", "quick recipes"]\n- Follower range: 100K-400K\n- Audience demographics: Highly aligned with [Target audience]\n- Engagement rate: 4%+\n- Content depth: Educational, expert-level content in their niche\n- Community authority: Recognized expert in their field\n- Audience trust: High-quality, engaged community\n- Content format: [e.g., "tutorials", "reviews", "lifestyle integration"]\n- Platform focus: [e.g., "Instagram primary", "TikTok secondary"]\n- Previous collaborations: Brand partnerships within their niche\n- Estimated cost: [e.g., "£800-£3K per post"]\n\nProvide: Niche specialist profiles, expertise validation, audience alignment analysis, collaboration potential.'
      },
      {
        short: 'Find mid-tier creators with strong growth trajectory (rising stars)',
        long: 'Find mid-tier creators with strong growth trajectory and rising influence:\n\n- Current followers: 100K-300K\n- Monthly growth rate: 5-10%+\n- Engagement rate: 4-6%\n- Content trend alignment: Creating trending/viral content\n- Audience demographics: [Target market]\n- Content categories: [e.g., "food", "lifestyle", "wellness"]\n- Platform momentum: Strong performance on TikTok/Instagram\n- Media attention: Growing press coverage or viral moments\n- Partnership history: Successful brand collaborations\n- Future potential: Likely to reach 500K+ within 12 months\n- Budget advantage: Lower costs than established macro-influencers\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Rising star profiles, growth trajectory analysis, partnership value, cost-benefit analysis.'
      },
      {
        short: 'Search for mid-tier creators ideal for long-term partnerships',
        long: 'Search for mid-tier creators ideal for 3-6 month brand ambassador partnerships:\n\n- Follower range: 150K-400K\n- Audience stability: Consistent, loyal audience\n- Content consistency: Regular posting schedule (4-5x per week)\n- Brand alignment: Values and aesthetics match [Brand Name]\n- Engagement quality: Authentic, high-quality audience interactions\n- Flexibility: Open to multiple content pieces and creative direction\n- Exclusivity: Willing to limit competing brand partnerships\n- Communication: Responsive and professional\n- Content creation speed: Can deliver content on schedule\n- Audience demographics: [Target market]\n- Partnership commitment: Interested in long-term relationship\n- Estimated cost: [e.g., "£2K-£8K per month for 3-6 month deal"]\n\nProvide: Partnership candidate profiles, commitment level assessment, content calendar recommendations, contract terms.'
      },
      {
        short: 'Identify mid-tier creators with proven conversion track record',
        long: 'Identify mid-tier creators with proven track record of driving conversions and sales:\n\n- Follower range: 150K-500K\n- Engagement rate: 3-5%+\n- Previous campaign ROI: Documented conversion/sales results\n- Audience demographics: High purchase intent audience\n- Content style: Product-focused, review-based, or lifestyle integration\n- Call-to-action effectiveness: Strong CTR and conversion rates\n- Platform focus: [e.g., "Instagram", "TikTok", "YouTube"]\n- Audience trust: High credibility and recommendation influence\n- Previous CPG partnerships: Experience with product-driven campaigns\n- Analytics sharing: Willing to provide detailed performance data\n- Estimated cost: [e.g., "£1K-£4K per post"]\n\nProvide: Performance-driven creator profiles, historical ROI data, conversion potential, partnership structure recommendations.'
      },
      {
        short: 'Find mid-tier creators for collaborative content creation',
        long: 'Find mid-tier creators for collaborative content creation and co-production:\n\n- Follower range: 150K-400K\n- Content production capability: Can co-create, film, and edit content\n- Creative input: Open to collaborative ideation and creative direction\n- Production quality: Professional or semi-professional production\n- Content formats: [e.g., "short-form video", "long-form content", "behind-the-scenes"]\n- Turnaround time: Quick content delivery (1-2 weeks)\n- Flexibility: Adaptable to brand requirements and revisions\n- Platform expertise: Understands platform-specific content optimization\n- Previous collaborations: Experience with brand content creation\n- Estimated cost: [e.g., "£1.5K-£5K per content piece"]\n\nProvide: Creator profiles, production capabilities, portfolio examples, collaboration workflow recommendations.'
      },
      {
        short: 'Find micro-influencers with hyper-engaged communities',
        long: 'Find micro-influencers (10K-100K followers) with exceptionally engaged communities:\n\n- Engagement rate: 5-10%+\n- Audience demographics: [Target market]\n- Community quality: Authentic, active comments and interactions\n- Follower authenticity: Minimal bot engagement\n- Content niche: [e.g., "food", "wellness", "lifestyle", "family"]\n- Posting frequency: Consistent (3-5x per week)\n- Audience loyalty: Strong repeat engagement and community\n- Content style: Authentic, relatable, non-corporate\n- Geographic focus: UK-based or UK audience\n- Partnership experience: Open to brand collaborations\n- Budget advantage: Cost-effective (£200-£1K per post)\n- Estimated cost: [e.g., "£300-£800 per post"]\n\nProvide: Micro-influencer profiles, engagement quality analysis, community insights, partnership opportunities.'
      },
      {
        short: 'Find micro-influencers who are niche community leaders',
        long: 'Identify micro-influencers who are leaders in specific communities:\n\n- Community focus: [e.g., "plant-based community", "budget-conscious families", "eco-conscious consumers", "fitness enthusiasts"]\n- Follower range: 15K-80K\n- Community authority: Recognized leader or expert in their community\n- Engagement rate: 6-10%+\n- Audience demographics: Highly aligned with [Target audience]\n- Community trust: High credibility and influence within community\n- Content themes: Educational, supportive, community-focused\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Community size: Active, engaged community members\n- Estimated cost: [e.g., "£200-£600 per post"]\n\nProvide: Community leader profiles, community size and engagement, influence assessment, partnership potential.'
      },
      {
        short: 'Search for emerging micro-influencers with high growth potential',
        long: 'Search for emerging micro-influencers with high growth potential:\n\n- Current followers: 5K-50K\n- Monthly growth rate: 10-20%+\n- Engagement rate: 6-12%\n- Content quality: High production value or authentic lifestyle content\n- Content trends: Creating trending/viral content\n- Audience demographics: [Target market]\n- Content categories: [e.g., "food", "lifestyle", "wellness"]\n- Platform momentum: Strong performance on TikTok/Instagram\n- Viral potential: Content with viral characteristics\n- Partnership history: Early-stage brand collaborations\n- Budget advantage: Very cost-effective (£100-£400 per post)\n- Growth trajectory: Likely to reach 100K+ within 12 months\n- Estimated cost: [e.g., "£150-£500 per post"]\n\nProvide: Emerging talent profiles, growth trajectory analysis, partnership value, long-term potential assessment.'
      },
      {
        short: 'Find micro-influencers skilled at lifestyle product integration',
        long: 'Find micro-influencers skilled at natural, authentic product integration:\n\n- Follower range: 20K-100K\n- Engagement rate: 5-8%+\n- Content style: Organic, lifestyle-focused, non-promotional\n- Integration skill: Seamless product placement and storytelling\n- Audience trust: High credibility and authentic recommendations\n- Content categories: [e.g., "daily lifestyle", "home", "food", "wellness"]\n- Platform focus: [e.g., "Instagram", "TikTok"]\n- Previous partnerships: Successful brand integrations\n- Audience demographics: [Target market]\n- Content frequency: Regular posting (3-4x per week)\n- Estimated cost: [e.g., "£250-£700 per post"]\n\nProvide: Specialist profiles, integration examples, audience trust analysis, partnership recommendations.'
      },
      {
        short: 'Identify network of micro-influencers for budget-friendly campaigns',
        long: 'Identify a network of micro-influencers for cost-effective, wide-reach campaigns:\n\n- Follower range: 20K-80K each\n- Total network size: [e.g., "10-20 creators"]\n- Combined reach: [e.g., "500K-1.5M"]\n- Engagement rate: 5%+\n- Audience demographics: [Target market]\n- Content niches: [e.g., "mix of food, lifestyle, wellness"]\n- Geographic spread: UK-wide coverage\n- Collaboration potential: Willing to cross-promote\n- Budget efficiency: [e.g., "£3K-£8K total for 10-15 creators"]\n- Campaign theme: [e.g., "product launch", "awareness campaign"]\n- Content requirements: [e.g., "1-2 posts per creator"]\n\nProvide: Curated micro-influencer network, combined reach analysis, campaign strategy, budget breakdown.'
      },
      {
        short: 'Find creators who excel at TikTok video content creation',
        long: 'Find creators who excel at TikTok video content creation:\n\n- Follower range: [e.g., "50K-300K"]\n- TikTok expertise: Consistent viral or high-performing content\n- Video format: [e.g., "short-form", "trending sounds", "challenges", "storytelling"]\n- Engagement rate: 4%+\n- Content categories: [e.g., "food", "lifestyle", "wellness", "entertainment"]\n- Audience demographics: [Target market]\n- Posting frequency: Regular (4-5x per week)\n- Trend awareness: Up-to-date with TikTok trends and sounds\n- Video production: Quality editing and creative direction\n- Platform algorithm understanding: Content optimized for TikTok\n- Estimated cost: [e.g., "£300-£2K per video"]\n\nProvide: TikTok specialist profiles, viral content examples, trend expertise, partnership recommendations.'
      },
      {
        short: 'Identify creators specializing in Instagram Reels content',
        long: 'Identify creators specializing in Instagram Reels content:\n\n- Follower range: [e.g., "50K-400K"]\n- Instagram expertise: High-performing Reels with strong engagement\n- Video format: [e.g., "short-form", "trending audio", "educational", "entertaining"]\n- Engagement rate: 3-5%+\n- Content categories: [e.g., "food", "lifestyle", "wellness", "beauty"]\n- Audience demographics: [Target market]\n- Posting frequency: Consistent Reels posting (3-4x per week)\n- Reels performance: Documented high views and engagement\n- Video quality: Professional editing and production\n- Cross-platform strategy: Repurposing content across platforms\n- Estimated cost: [e.g., "£300-£1.5K per Reel"]\n\nProvide: Reels expert profiles, performance examples, content strategy insights, partnership opportunities.'
      },
      {
        short: 'Find creators producing high-quality long-form YouTube content',
        long: 'Find creators producing high-quality long-form YouTube content:\n\n- Subscriber range: [e.g., "50K-500K"]\n- Video length: [e.g., "10-30 minutes"]\n- Content categories: [e.g., "reviews", "tutorials", "vlogs", "educational"]\n- Audience demographics: [Target market]\n- Video production quality: Professional production and editing\n- Engagement rate: 2-4%+\n- Upload frequency: Consistent (1-2x per week)\n- Audience loyalty: Strong subscriber engagement and community\n- Monetization status: Verified YouTube partner\n- Content depth: Detailed, informative, or entertaining content\n- Estimated cost: [e.g., "£1K-£5K per video"]\n\nProvide: YouTube creator profiles, channel performance metrics, audience insights, partnership recommendations.'
      },
      {
        short: 'Identify creators skilled at producing multiple video formats',
        long: 'Identify creators skilled at producing multiple video formats:\n\n- Follower range: [e.g., "100K-500K"]\n- Video formats: TikTok, Instagram Reels, YouTube Shorts, long-form YouTube\n- Production capability: Can create platform-specific content\n- Engagement rates: 3-5%+ across platforms\n- Content categories: [e.g., "food", "lifestyle", "wellness"]\n- Audience demographics: [Target market]\n- Turnaround time: Quick content delivery\n- Video quality: Professional production across formats\n- Platform optimization: Understands each platform\'s algorithm\n- Estimated cost: [e.g., "£500-£2K per content package"]\n\nProvide: Multi-format creator profiles, production capabilities, portfolio examples, partnership structure.'
      },
      {
        short: 'Find creators specializing in recipe and food content',
        long: 'Find creators specializing in recipe and food content:\n\n- Follower range: [e.g., "30K-300K"]\n- Content focus: Recipes, cooking tutorials, food reviews, food styling\n- Video format: [e.g., "short-form", "long-form tutorials", "ASMR cooking"]\n- Engagement rate: 4-6%+\n- Audience demographics: [e.g., "food enthusiasts", "home cooks", "busy families"]\n- Content quality: Professional food styling and videography\n- Recipe variety: [e.g., "quick meals", "healthy recipes", "budget-friendly", "plant-based"]\n- Audience trust: High credibility in food/cooking space\n- Platform focus: [e.g., "TikTok", "Instagram", "YouTube"]\n- Estimated cost: [e.g., "£300-£1.5K per video"]\n\nProvide: Food content creator profiles, recipe specialization, audience insights, partnership opportunities.'
      },
      {
        short: 'Find creators whose audiences perfectly match target customer profile',
        long: 'Find creators whose audiences perfectly match [Brand Name]\'s target customer profile:\n\n- Target customer profile: [e.g., "UK women 25-45, affluent, health-conscious, eco-aware, family-oriented"]\n- Audience size: [e.g., "50K-500K followers"]\n- Audience demographics: Age, gender, location, income level, interests\n- Audience psychographics: Values, lifestyle, purchasing behavior\n- Audience engagement: Quality of audience interactions and loyalty\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Content alignment: Creator content matches audience interests\n- Audience authenticity: Real, engaged followers\n- Purchase intent: Audience with buying power and product interest\n- Estimated cost: [e.g., "£300-£2K per post"]\n\nProvide: Creator profiles with audience alignment analysis, demographic breakdowns, partnership recommendations.'
      },
      {
        short: 'Identify creators with significant audience overlap with existing customers',
        long: 'Identify creators with significant audience overlap with [Brand Name]\'s existing customer base:\n\n- Existing customer profile: [e.g., "UK families, budget-conscious, value-driven"]\n- Audience overlap percentage: 40%+\n- Follower range: [e.g., "50K-300K"]\n- Content categories: [e.g., "food", "family", "lifestyle", "wellness"]\n- Engagement quality: High-quality audience interactions\n- Platform: [e.g., "Instagram", "TikTok"]\n- Geographic focus: UK-based or UK audience\n- Audience loyalty: Strong repeat engagement\n- Cross-sell potential: Audience likely to purchase [Product Category]\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Creator profiles, audience overlap analysis, cross-sell potential, partnership recommendations.'
      },
      {
        short: 'Find creators who can introduce brand to new audience segments',
        long: 'Find creators who can introduce [Brand Name] to new, adjacent audience segments:\n\n- Current audience: [e.g., "UK families, 35-55, traditional"]\n- Target new audience: [e.g., "younger professionals 25-35, trendy, digital-native"]\n- Follower range: [e.g., "100K-500K"]\n- Audience demographics: [New target demographics]\n- Content style: Appeals to new audience segment\n- Platform focus: [e.g., "TikTok", "Instagram"]\n- Engagement rate: 3-5%+\n- Content categories: [e.g., "lifestyle", "wellness", "entertainment"]\n- Audience growth: Expanding audience segment\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Creator profiles, new audience insights, expansion potential, partnership strategy.'
      },
      {
        short: 'Identify creators with high-income affluent audiences',
        long: 'Identify creators with high-income, affluent audiences:\n\n- Target audience income: [e.g., "£50K+", "£75K+"]\n- Follower range: [e.g., "100K-500K"]\n- Audience demographics: Affluent, educated, professional\n- Content focus: [e.g., "premium lifestyle", "wellness", "luxury", "experiences"]\n- Engagement rate: 2-4%+\n- Platform: [e.g., "Instagram", "YouTube"]\n- Audience trust: High credibility with affluent consumers\n- Purchase power: Audience with significant buying power\n- Brand partnerships: Previous luxury/premium brand collaborations\n- Estimated cost: [e.g., "£1K-£5K per post"]\n\nProvide: Creator profiles, audience income analysis, premium positioning potential, partnership recommendations.'
      },
      {
        short: 'Find creators with engaged family audiences',
        long: 'Find creators with engaged family audiences:\n\n- Audience focus: Families with children\n- Age range: [e.g., "parents 25-50"]\n- Follower range: [e.g., "50K-300K"]\n- Content themes: [e.g., "family moments", "parenting", "kids activities", "family meals"]\n- Engagement rate: 4-6%+\n- Audience demographics: Families, parents, caregivers\n- Content authenticity: Real family life, relatable content\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Audience trust: High credibility with parents\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Family-focused creator profiles, audience insights, family appeal analysis, partnership opportunities.'
      },
      {
        short: 'Find creators with UK-wide audience reach for national campaigns',
        long: 'Find creators with UK-wide audience reach for national campaign:\n\n- Geographic reach: UK-wide (England, Scotland, Wales, Northern Ireland)\n- Follower range: [e.g., "100K-500K"]\n- Audience distribution: Balanced across UK regions\n- Content relevance: UK-focused or UK-relevant content\n- Platform: [e.g., "TikTok", "Instagram", "YouTube"]\n- Engagement rate: 3-5%+\n- Audience demographics: [Target market]\n- Campaign fit: [e.g., "national product launch", "UK-wide awareness"]\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: UK-wide creator profiles, geographic reach analysis, regional coverage breakdown, partnership recommendations.'
      },
      {
        short: 'Identify creators with strong regional influence in specific UK areas',
        long: 'Identify creators with strong regional influence in specific UK areas:\n\n- Target regions: [e.g., "London", "Manchester", "Scotland", "Midlands", "South West"]\n- Follower range: [e.g., "30K-200K"]\n- Regional audience: Strong local following and influence\n- Content focus: Regional lifestyle, local culture, regional interests\n- Engagement rate: 4-6%+\n- Local authority: Recognized local influencer or personality\n- Platform: [e.g., "Instagram", "TikTok"]\n- Regional campaigns: Experience with regional brand campaigns\n- Estimated cost: [e.g., "£200-£800 per post"]\n\nProvide: Regional creator profiles, local influence assessment, regional reach analysis, partnership opportunities.'
      },
      {
        short: 'Find creators representing both urban and rural UK audiences',
        long: 'Find creators representing both urban and rural UK audiences:\n\n- Urban creators: [e.g., "London", "Manchester", "Birmingham"]\n- Rural creators: [e.g., "countryside", "small towns", "villages"]\n- Follower range: [e.g., "50K-300K"]\n- Audience demographics: Urban and rural lifestyle differences\n- Content themes: Urban lifestyle vs. rural/countryside living\n- Engagement rate: 4-6%+\n- Platform: [e.g., "Instagram", "TikTok"]\n- Campaign fit: [e.g., "inclusive campaign", "broad market reach"]\n- Estimated cost: [e.g., "£300-£1.5K per creator"]\n\nProvide: Urban and rural creator profiles, audience split analysis, inclusive reach strategy, partnership recommendations.'
      },
      {
        short: 'Find creators with exceptionally high engagement rates',
        long: 'Find creators with exceptionally high engagement rates:\n\n- Engagement rate: 5%+ (micro), 4%+ (mid-tier), 2-3%+ (macro)\n- Follower range: [e.g., "any tier"]\n- Audience quality: Authentic, engaged followers\n- Content categories: [e.g., "food", "lifestyle", "wellness"]\n- Engagement type: Comments, shares, saves, not just likes\n- Audience demographics: [Target market]\n- Platform: [e.g., "TikTok", "Instagram"]\n- Content consistency: Regular posting with consistent engagement\n- Estimated cost: [e.g., "varies by tier"]\n\nProvide: High-engagement creator profiles, engagement quality analysis, audience authenticity verification, partnership recommendations.'
      },
      {
        short: 'Identify creators with proven track record of driving conversions',
        long: 'Identify creators with proven track record of driving conversions and sales:\n\n- Follower range: [e.g., "50K-500K"]\n- Previous campaign ROI: Documented conversion/sales results\n- Engagement rate: 3-5%+\n- Audience demographics: High purchase intent audience\n- Content style: Product-focused, review-based, or lifestyle integration\n- Call-to-action effectiveness: Strong CTR and conversion rates\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Analytics sharing: Willing to provide detailed performance data\n- Previous CPG partnerships: Experience with product-driven campaigns\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Conversion-focused creator profiles, historical ROI data, conversion potential, partnership structure recommendations.'
      },
      {
        short: 'Find creators with consistent track record of creating viral content',
        long: 'Find creators with consistent track record of creating viral content:\n\n- Follower range: [e.g., "50K-500K"]\n- Viral content frequency: Regular viral or high-performing posts\n- Engagement rate: 4-6%+\n- Content categories: [e.g., "trending", "entertaining", "educational"]\n- Viral characteristics: Understanding of viral mechanics\n- Platform expertise: Platform algorithm knowledge\n- Audience demographics: [Target market]\n- Content style: Entertaining, shareable, trend-aware\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Viral content creator profiles, viral content examples, trend expertise, partnership recommendations.'
      },
      {
        short: 'Identify creators with consistent predictable growth patterns',
        long: 'Identify creators with consistent, predictable growth patterns:\n\n- Current followers: [e.g., "50K-300K"]\n- Monthly growth rate: 5-15%+ consistent growth\n- Growth consistency: Steady growth over 6-12 months\n- Engagement rate: 4-6%+\n- Audience demographics: [Target market]\n- Content consistency: Regular posting schedule\n- Platform momentum: Strong performance trajectory\n- Future potential: Predictable growth to next tier\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Growth-focused creator profiles, growth trajectory analysis, future potential assessment, partnership value.'
      },
      {
        short: 'Build network of creators for collaborative multi-creator campaign',
        long: 'Build a network of creators for collaborative, multi-creator campaign:\n\n- Campaign theme: [e.g., "product launch", "seasonal campaign", "brand awareness"]\n- Total creators needed: [e.g., "5-15 creators"]\n- Creator tier mix: [e.g., "1-2 macro, 3-5 mid-tier, 5-10 micro"]\n- Audience demographics: [Target market]\n- Content style diversity: Mix of content styles and approaches\n- Geographic spread: UK-wide coverage\n- Collaboration potential: Creators who can cross-promote\n- Combined reach: [e.g., "1M-3M total reach"]\n- Budget: [e.g., "£5K-£15K total"]\n- Campaign duration: [e.g., "4-8 weeks"]\n\nProvide: Curated creator network, collaboration synergies, combined reach analysis, campaign strategy recommendations.'
      },
      {
        short: 'Find creators interested in co-creation and collaborative content development',
        long: 'Find creators interested in co-creation and collaborative content development:\n\n- Follower range: [e.g., "100K-500K"]\n- Co-creation experience: Previous collaborative content projects\n- Creative input: Open to collaborative ideation\n- Production capability: Can co-produce and co-edit content\n- Flexibility: Adaptable to brand requirements\n- Communication: Responsive and collaborative\n- Content quality: Professional or semi-professional production\n- Turnaround time: Quick content delivery\n- Estimated cost: [e.g., "£1K-£5K per collaborative piece"]\n\nProvide: Co-creation partner profiles, collaboration experience, production capabilities, workflow recommendations.'
      },
      {
        short: 'Identify creators open to exclusive brand partnerships',
        long: 'Identify creators open to exclusive brand partnerships:\n\n- Follower range: [e.g., "100K-400K"]\n- Exclusivity interest: Willing to limit competing brand partnerships\n- Partnership duration: 3-12 month exclusive arrangements\n- Audience demographics: [Target market]\n- Content commitment: Multiple content pieces per month\n- Brand alignment: Strong values and aesthetics match\n- Flexibility: Open to creative direction and brand guidelines\n- Communication: Professional and responsive\n- Estimated cost: [e.g., "£2K-£8K per month for exclusive partnership"]\n\nProvide: Exclusive partnership candidate profiles, commitment level assessment, contract terms, partnership structure.'
      },
      {
        short: 'Find creators suitable for long-term brand ambassador programs',
        long: 'Find creators suitable for long-term brand ambassador programs:\n\n- Follower range: [e.g., "100K-500K"]\n- Program duration: 6-12 month ambassador commitment\n- Audience demographics: [Target market]\n- Brand alignment: Strong fit with brand values and positioning\n- Content consistency: Regular posting and engagement\n- Flexibility: Open to multiple content pieces and creative direction\n- Exclusivity: Willing to limit competing brand partnerships\n- Communication: Professional, responsive, collaborative\n- Audience loyalty: Strong community trust and influence\n- Estimated cost: [e.g., "£3K-£10K per month for ambassador program"]\n\nProvide: Ambassador candidate profiles, program fit assessment, commitment level, contract recommendations.'
      },
      {
        short: 'Find creators known for humorous entertaining content',
        long: 'Find creators known for humorous, entertaining content:\n\n- Follower range: [e.g., "50K-300K"]\n- Content style: Funny, entertaining, comedic\n- Humor type: [e.g., "observational", "sarcastic", "absurdist", "relatable"]\n- Engagement rate: 4-6%+\n- Audience demographics: [Target market]\n- Platform: [e.g., "TikTok", "Instagram"]\n- Content categories: [e.g., "lifestyle", "food", "family", "entertainment"]\n- Audience response: Strong audience laughter and shares\n- Brand fit: Humor aligns with brand personality\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Humorous content creator profiles, humor style examples, audience response analysis, partnership recommendations.'
      },
      {
        short: 'Identify creators specializing in educational informative content',
        long: 'Identify creators specializing in educational, informative content:\n\n- Follower range: [e.g., "50K-300K"]\n- Content focus: Educational, tutorial, how-to, expert advice\n- Expertise: [e.g., "nutrition", "cooking", "wellness", "sustainability"]\n- Engagement rate: 3-5%+\n- Audience demographics: [Target market]\n- Content depth: Detailed, informative, expert-level content\n- Platform: [e.g., "YouTube", "Instagram", "TikTok"]\n- Audience trust: High credibility and authority\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Educational creator profiles, expertise validation, audience trust analysis, partnership opportunities.'
      },
      {
        short: 'Find creators creating aspirational premium lifestyle content',
        long: 'Find creators creating aspirational, premium lifestyle content:\n\n- Follower range: [e.g., "100K-500K"]\n- Content style: Aspirational, premium, luxury lifestyle\n- Aesthetic: High-quality photography, curated lifestyle\n- Audience demographics: Affluent, aspirational audience\n- Content categories: [e.g., "lifestyle", "wellness", "home", "experiences"]\n- Engagement rate: 2-4%+\n- Platform: [e.g., "Instagram", "YouTube"]\n- Brand partnerships: Previous luxury/premium brand collaborations\n- Estimated cost: [e.g., "£1K-£5K per post"]\n\nProvide: Aspirational lifestyle creator profiles, aesthetic analysis, audience insights, partnership recommendations.'
      },
      {
        short: 'Identify creators known for authentic relatable down-to-earth content',
        long: 'Identify creators known for authentic, relatable, down-to-earth content:\n\n- Follower range: [e.g., "50K-300K"]\n- Content style: Authentic, relatable, genuine, non-corporate\n- Aesthetic: Real life, unfiltered, honest content\n- Audience demographics: [Target market]\n- Engagement rate: 4-6%+\n- Audience connection: Strong audience loyalty and relatability\n- Content categories: [e.g., "lifestyle", "family", "wellness", "daily life"]\n- Platform: [e.g., "Instagram", "TikTok"]\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Authentic creator profiles, relatability analysis, audience connection assessment, partnership opportunities.'
      },
      {
        short: 'Find creators focused on sustainability and eco-conscious living',
        long: 'Find creators focused on sustainability and eco-conscious living:\n\n- Follower range: [e.g., "30K-300K"]\n- Content focus: Sustainability, eco-friendly, zero-waste, ethical consumption\n- Audience demographics: Eco-conscious, values-driven consumers\n- Engagement rate: 4-6%+\n- Audience trust: High credibility in sustainability space\n- Content depth: Educational, expert-level sustainability content\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Brand alignment: [Brand Name]\'s sustainability values\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Eco-conscious creator profiles, sustainability expertise, audience values alignment, partnership opportunities.'
      },
      {
        short: 'Identify creators specializing in health wellness and nutrition',
        long: 'Identify creators specializing in health, wellness, and nutrition:\n\n- Follower range: [e.g., "50K-300K"]\n- Content focus: Health, wellness, nutrition, fitness, mental health\n- Expertise: [e.g., "nutritionist", "fitness coach", "wellness expert"]\n- Audience demographics: Health-conscious, wellness-focused consumers\n- Engagement rate: 3-5%+\n- Credibility: Professional credentials or recognized expertise\n- Platform: [e.g., "Instagram", "YouTube", "TikTok"]\n- Content quality: Evidence-based, expert-level content\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Health & wellness creator profiles, expertise validation, audience insights, partnership recommendations.'
      },
      {
        short: 'Find creators from diverse backgrounds and underrepresented communities',
        long: 'Find creators from diverse backgrounds and underrepresented communities:\n\n- Follower range: [e.g., "20K-300K"]\n- Community representation: [e.g., "BAME creators", "LGBTQ+ creators", "creators with disabilities", "neurodivergent creators"]\n- Audience demographics: Diverse, inclusive community\n- Engagement rate: 4-6%+\n- Authenticity: Authentic representation and community connection\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Content themes: Authentic, culturally relevant content\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Diverse creator profiles, community representation, authenticity assessment, partnership opportunities.'
      },
      {
        short: 'Identify creators who are parents and family influencers',
        long: 'Identify creators who are parents and family influencers:\n\n- Follower range: [e.g., "50K-300K"]\n- Content focus: Parenting, family life, kids, family moments\n- Audience demographics: Parents, families, caregivers\n- Engagement rate: 4-6%+\n- Authenticity: Real family life, relatable parenting content\n- Platform: [e.g., "Instagram", "TikTok", "YouTube"]\n- Family size: [e.g., "1-2 kids", "3+ kids", "blended families"]\n- Content themes: Family moments, parenting tips, family activities\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Parent influencer profiles, family audience insights, relatability analysis, partnership opportunities.'
      },
      {
        short: 'Find creators who are Gen Z and understand youth culture',
        long: 'Find creators who are Gen Z and understand youth culture:\n\n- Follower range: [e.g., "50K-300K"]\n- Creator age: [e.g., "18-30 years old"]\n- Audience demographics: Gen Z, younger millennials\n- Content style: Trendy, youth-focused, culturally relevant\n- Platform expertise: TikTok, Instagram, YouTube Shorts\n- Trend awareness: Up-to-date with youth trends and culture\n- Engagement rate: 4-6%+\n- Authenticity: Genuine Gen Z voice and perspective\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Gen Z creator profiles, youth culture expertise, trend awareness, partnership recommendations.'
      },
      {
        short: 'Analyze creators working with competitor brands',
        long: 'Analyze creators working with competitor brands:\n\n- Competitor brands: [e.g., "Branston Beans competitors", "similar CPG brands"]\n- Analysis scope: All creators currently partnering with competitors\n- Creator tier breakdown: Macro, mid-tier, micro distribution\n- Content themes: Messaging and content approaches used\n- Engagement performance: Competitor content performance metrics\n- Audience overlap: Creators with audience overlap to [Brand Name]\n- Partnership opportunities: Creators open to [Brand Name] partnerships\n- Competitive gaps: Opportunities in competitor\'s creator strategy\n- Estimated cost: [e.g., "varies by creator tier"]\n\nProvide: Competitor creator list, performance analysis, partnership opportunities, competitive strategy recommendations.'
      },
      {
        short: 'Identify creators filling market gaps in product category',
        long: 'Identify creators filling market gaps in [Product Category]:\n\n- Market gaps: [e.g., "underserved audience segments", "missing content types"]\n- Follower range: [e.g., "50K-300K"]\n- Content focus: Addressing market gaps\n- Audience demographics: Underserved audience segments\n- Engagement rate: 4-6%+\n- Growth potential: Emerging creators in gap areas\n- Platform: [e.g., "TikTok", "Instagram"]\n- Estimated cost: [e.g., "£300-£1.5K per post"]\n\nProvide: Gap-filling creator profiles, market opportunity analysis, growth potential, partnership recommendations.'
      },
      {
        short: 'Find creators who set trends rather than follow them',
        long: 'Find creators who set trends rather than follow them:\n\n- Follower range: [e.g., "100K-500K"]\n- Trend-setting ability: Creators who originate trends\n- Content innovation: Original, innovative content ideas\n- Engagement rate: 4-6%+\n- Audience demographics: [Target market]\n- Platform influence: Recognized trend-setters on platform\n- Content categories: [e.g., "food", "lifestyle", "wellness"]\n- Estimated cost: [e.g., "£500-£2K per post"]\n\nProvide: Trend-setting creator profiles, innovation examples, influence assessment, partnership recommendations.'
      },
      {
        short: 'Find creators perfect for product launch campaign',
        long: 'Find creators perfect for [Product Name] product launch campaign:\n\n- Campaign type: Product launch\n- Product category: [e.g., "new snack", "new flavor", "new product line"]\n- Campaign duration: [e.g., "4-8 weeks"]\n- Creator tier mix: [e.g., "2-3 macro, 5-8 mid-tier, 10-15 micro"]\n- Audience demographics: [Target market]\n- Content requirements: [e.g., "unboxing", "first impressions", "product review"]\n- Exclusivity: First-to-market content\n- Timing: Coordinated launch timing\n- Budget: [e.g., "£10K-£30K"]\n- Estimated cost: [e.g., "varies by tier"]\n\nProvide: Product launch creator recommendations, campaign strategy, timeline, budget breakdown.'
      },
      {
        short: 'Identify creators for seasonal campaigns',
        long: 'Identify creators for seasonal campaigns:\n\n- Campaign season: [e.g., "Christmas 2025", "Summer 2025", "Easter 2025"]\n- Follower range: [e.g., "50K-500K"]\n- Content alignment: Seasonal content themes\n- Audience demographics: [Target market]\n- Campaign duration: [e.g., "4-8 weeks"]\n- Content requirements: [e.g., "festive content", "seasonal lifestyle"]\n- Previous seasonal campaigns: Track record with seasonal content\n- Availability: Confirmed availability during season\n- Budget: [e.g., "£5K-£20K"]\n- Estimated cost: [e.g., "varies by creator"]\n\nProvide: Seasonal campaign creator recommendations, content ideas, timeline, budget breakdown.'
      },
    ],
  },
  {
    id: 'research',
    label: 'Social Media Intelligence',
    icon: <Video className="w-4 h-4" />,
    samplePrompts: [
      {
        short: 'Analyze trending content patterns on TikTok for fitness brands',
        long: 'Use video intelligence to analyze trending content patterns on TikTok for fitness brands. Identify what types of fitness content are currently going viral, analyze engagement metrics, identify key hooks and CTAs that work, and provide insights on content strategy for fitness brands looking to expand on TikTok.'
      },
      {
        short: 'Compare Nike and Adidas video content strategies on TikTok',
        long: 'Use video intelligence to compare Nike and Adidas video content strategies on TikTok. Upload and index videos from both brand channels, analyze their content themes, hooks, CTAs, pacing, visual elements, and engagement patterns. Provide a comprehensive side-by-side comparison with actionable insights on what\'s working for each brand.'
      },
      {
        short: 'Find viral food content trends and analyze what makes them successful',
        long: 'Use video intelligence to search for trending food content on TikTok. Analyze the top performing videos to identify common patterns in hooks, storytelling techniques, visual elements, and CTAs. Provide insights on what makes food content go viral and best practices for creating engaging food content.'
      },
      {
        short: 'Research top-performing videos from @MrBeast on TikTok and analyze his content strategy',
        long: 'Use video intelligence to research top-performing videos from @MrBeast on TikTok. Upload and index his recent videos, analyze video structure, hooks, pacing, visual elements, and engagement drivers. Extract transcripts and summaries to understand messaging patterns. Provide a comprehensive analysis of his content strategy and what makes his videos so engaging.'
      },
      {
        short: 'Analyze competitor brand content on hashtag #sustainability on TikTok',
        long: 'Use video intelligence to analyze competitor brand content using hashtag #sustainability on TikTok. Upload and index videos from this hashtag, compare content approaches, identify top performers, analyze messaging themes, engagement patterns, and provide strategic insights on sustainability content marketing.'
      },
      {
        short: 'Find top trending beauty tutorials on TikTok and analyze their structure',
        long: 'Search the video intelligence library for top trending beauty tutorials on TikTok. Analyze the video structure, hooks, pacing, visual storytelling, product placement techniques, and CTAs. Extract transcripts to understand verbal techniques. Provide insights on what makes beauty tutorial content successful and how to structure engaging tutorials.'
      },
      {
        short: 'Compare viral vs average-performing videos in the lifestyle niche on TikTok',
        long: 'Use video intelligence to compare viral vs average-performing videos in the lifestyle niche on TikTok. Identify viral lifestyle videos and compare them with average performers from the same creators or similar content. Analyze differences in hooks, pacing, visual elements, CTAs, and engagement metrics. Provide insights on what separates viral content from average content.'
      },
      {
        short: 'Analyze brand ambassador content effectiveness for luxury products on TikTok',
        long: 'Use video intelligence to analyze brand ambassador content effectiveness for luxury products on TikTok. Upload videos from brand ambassadors, analyze content quality, engagement rates, audience alignment, product integration techniques, and messaging effectiveness. Compare performance across different ambassadors and provide insights on what makes effective luxury brand content.'
      },
      {
        short: 'Research trending short-form video formats and their engagement rates on TikTok',
        long: 'Search the video intelligence library for trending short-form video formats on TikTok. Categorize formats (tutorials, behind-the-scenes, challenges, etc.), analyze engagement metrics for each format, identify successful patterns, and provide insights on which formats work best for different industries and audiences.'
      },
      {
        short: 'Analyze content from top creators in the wellness space on TikTok',
        long: 'Use video intelligence to analyze content from top creators in the wellness space on TikTok. Upload videos from multiple wellness influencers, compare their content strategies, analyze hooks and CTAs, extract transcripts to understand messaging patterns, compare engagement metrics, and provide insights on effective wellness content marketing strategies.'
      },
      {
        short: 'Find and analyze product launch videos on TikTok that generated high engagement',
        long: 'Search the video intelligence library for product launch videos with high engagement on TikTok. Analyze video structure, hooks, storytelling techniques, product reveal moments, visual elements, CTAs, and engagement patterns. Extract insights on what makes product launch videos successful and best practices for creating engaging launch content.'
      },
    ],
  },
];

// Helper function to normalize prompt items to display strings
const normalizePromptForDisplay = (prompt: PromptItem): string => {
  if (typeof prompt === 'string') {
    return prompt;
  }
  return prompt.short;
};

// Helper function to get the full prompt text for submission
const getFullPrompt = (prompt: PromptItem): string => {
  if (typeof prompt === 'string') {
    return prompt;
  }
  return prompt.long;
};

// Helper function to get random prompts (returns PromptItem[] for display)
const getRandomPrompts = (prompts: PromptItem[], count: number): PromptItem[] => {
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Output format icon component
const OutputFormatIcon = ({ type, className }: { type: string; className?: string }) => {
  const baseClasses = cn('w-full h-full', className);
  
  switch (type) {
    case 'spreadsheet':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Table background */}
          <rect x="10" y="20" width="80" height="60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="4"/>
          
          {/* Header row background */}
          <rect x="10" y="20" width="80" height="12" fill="currentColor" opacity="0.15" rx="4" />
          
          {/* Grid lines - horizontal */}
          <line x1="10" y1="32" x2="90" y2="32" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
          <line x1="10" y1="44" x2="90" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          <line x1="10" y1="56" x2="90" y2="56" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          <line x1="10" y1="68" x2="90" y2="68" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          
          {/* Grid lines - vertical */}
          <line x1="30" y1="20" x2="30" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          <line x1="70" y1="20" x2="70" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          
          {/* Data cells */}
          <rect x="14" y="24" width="12" height="5" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="34" y="36" width="12" height="5" fill="currentColor" opacity="0.5" rx="1"/>
          <rect x="54" y="48" width="12" height="5" fill="currentColor" opacity="0.4" rx="1"/>
          <rect x="74" y="60" width="12" height="5" fill="currentColor" opacity="0.5" rx="1"/>
          <rect x="14" y="48" width="12" height="5" fill="currentColor" opacity="0.4" rx="1"/>
          <rect x="34" y="60" width="12" height="5" fill="currentColor" opacity="0.5" rx="1"/>
          
          {/* Formula bar */}
          <rect x="10" y="10" width="80" height="7" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="2"/>
          <text x="13" y="15" fontSize="6" opacity="0.4">fx</text>
          <rect x="22" y="12" width="30" height="3" fill="currentColor" opacity="0.3" rx="0.5"/>
        </svg>
      );
    
    case 'dashboard':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Top left widget - KPI */}
          <rect x="10" y="15" width="35" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="4"/>
          <rect x="10" y="15" width="35" height="8" fill="currentColor" opacity="0.1" rx="4"/>
          <circle cx="17" cy="19" r="2" fill="currentColor" opacity="0.6"/>
          <rect x="22" y="17.5" width="18" height="3" fill="currentColor" opacity="0.4" rx="1"/>
          <text x="15" y="36" fontSize="12" opacity="0.7" fontWeight="600">42K</text>
          
          {/* Top right widget - Line chart */}
          <rect x="52" y="15" width="38" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="4"/>
          <path d="M 58,35 L 65,30 L 72,32 L 79,28 L 84,31" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
          <circle cx="58" cy="35" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="65" cy="30" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="72" cy="32" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="79" cy="28" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="84" cy="31" r="1.5" fill="currentColor" opacity="0.7"/>
          
          {/* Bottom widget - Bar chart */}
          <rect x="10" y="50" width="80" height="35" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="4"/>
          <rect x="18" y="65" width="8" height="15" fill="currentColor" opacity="0.5" rx="1"/>
          <rect x="32" y="60" width="8" height="20" fill="currentColor" opacity="0.6" rx="1"/>
          <rect x="46" y="62" width="8" height="18" fill="currentColor" opacity="0.5" rx="1"/>
          <rect x="60" y="55" width="8" height="25" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="74" y="58" width="8" height="22" fill="currentColor" opacity="0.6" rx="1"/>
          <line x1="10" y1="80" x2="90" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
        </svg>
      );
    
    case 'report':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Document */}
          <rect x="20" y="10" width="60" height="80" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          
          {/* Page fold effect */}
          <path d="M 70,10 L 80,20 L 80,10 Z" fill="currentColor" opacity="0.1"/>
          
          {/* Title */}
          <rect x="28" y="20" width="44" height="5" fill="currentColor" opacity="0.8" rx="1"/>
          
          {/* Subtitle */}
          <rect x="28" y="28" width="30" height="3" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          {/* Paragraph lines */}
          <rect x="28" y="36" width="44" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="28" y="40" width="40" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="28" y="44" width="42" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          {/* Chart section */}
          <rect x="28" y="52" width="44" height="22" fill="currentColor" opacity="0.05" rx="2"/>
          <rect x="34" y="64" width="6" height="8" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="42" y="60" width="6" height="12" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="50" y="62" width="6" height="10" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="58" y="58" width="6" height="14" fill="currentColor" opacity="0.8" rx="0.5"/>
          <line x1="28" y1="72" x2="72" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          
          {/* More text */}
          <rect x="28" y="78" width="38" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="28" y="82" width="44" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
        </svg>
      );
    
    case 'slides':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Main slide */}
          <rect x="15" y="20" width="70" height="52" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" rx="3"/>
          
          {/* Title area */}
          <rect x="22" y="28" width="35" height="5" fill="currentColor" opacity="0.8" rx="1"/>
          
          {/* Subtitle */}
          <rect x="22" y="36" width="25" height="3" fill="currentColor" opacity="0.5" rx="0.5"/>
          
          {/* Content bullets */}
          <circle cx="24" cy="46" r="1" fill="currentColor" opacity="0.6"/>
          <rect x="28" y="45" width="20" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <circle cx="24" cy="52" r="1" fill="currentColor" opacity="0.6"/>
          <rect x="28" y="51" width="18" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <circle cx="24" cy="58" r="1" fill="currentColor" opacity="0.6"/>
          <rect x="28" y="57" width="22" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          {/* Image placeholder */}
          <rect x="58" y="44" width="20" height="20" fill="currentColor" opacity="0.1" rx="2"/>
          <circle cx="68" cy="54" r="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <path d="M 60,60 L 65,55 L 70,58 L 76,52" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          
          {/* Slide indicators */}
          <rect x="20" y="78" width="10" height="6" fill="currentColor" opacity="0.3" rx="1"/>
          <rect x="35" y="78" width="10" height="6" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="50" y="78" width="10" height="6" fill="currentColor" opacity="0.3" rx="1"/>
          <rect x="65" y="78" width="10" height="6" fill="currentColor" opacity="0.3" rx="1"/>
        </svg>
      );
    
    default:
      return <Table className="w-6 h-6" />;
  }
};

// Slide template icon component
const SlideTemplateIcon = ({ type, className }: { type: string; className?: string }) => {
  const baseClasses = cn('w-full h-full', className);
  
  switch (type) {
    case 'modern':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="15" y="20" width="70" height="50" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          <rect x="20" y="28" width="30" height="4" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="20" y="36" width="20" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <line x1="20" y1="44" x2="38" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <rect x="20" y="48" width="25" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="20" y="52" width="22" height="2" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="55" y="28" width="25" height="25" fill="currentColor" opacity="0.15" rx="2"/>
          <circle cx="67.5" cy="40.5" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
          <rect x="25" y="75" width="50" height="3" fill="currentColor" opacity="0.2" rx="1"/>
        </svg>
      );
    
    case 'bold':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="10" y="15" width="80" height="55" fill="currentColor" opacity="0.15" rx="4"/>
          <rect x="15" y="22" width="35" height="8" fill="currentColor" opacity="0.9" rx="2"/>
          <rect x="15" y="35" width="28" height="4" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="15" y="43" width="32" height="4" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="15" y="51" width="30" height="4" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="55" y="22" width="30" height="18" fill="currentColor" opacity="0.8" rx="2"/>
          <circle cx="70" cy="31" r="5" fill="var(--background)" opacity="0.9"/>
          <rect x="10" y="75" width="80" height="8" fill="currentColor" opacity="0.9" rx="2"/>
        </svg>
      );
    
    case 'elegant':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <line x1="30" y1="25" x2="70" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          <rect x="35" y="32" width="30" height="5" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="40" y="42" width="20" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <circle cx="50" cy="55" r="1" fill="currentColor" opacity="0.5"/>
          <rect x="30" y="60" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="32" y="64" width="36" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="34" y="68" width="32" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <line x1="30" y1="78" x2="70" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          <path d="M 48,25 L 50,20 L 52,25" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.4"/>
        </svg>
      );
    
    case 'tech':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="15" y="20" width="70" height="50" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" rx="2"/>
          <path d="M 15,30 L 85,30" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <circle cx="20" cy="25" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="26" cy="25" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="32" cy="25" r="1.5" fill="currentColor" opacity="0.6"/>
          <rect x="20" y="36" width="25" height="3" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="20" y="42" width="18" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <path d="M 55,38 L 60,43 L 55,48" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d="M 65,38 L 75,38 L 75,58 L 65,58" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
          <rect x="20" y="52" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <path d="M 20,58 L 32,58 M 26,52 L 26,64" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      );
    
    case 'creative':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <path d="M 20,25 Q 25,20 35,25 L 40,35 Q 30,30 20,35 Z" opacity="0.6"/>
          <circle cx="70" cy="30" r="8" opacity="0.5"/>
          <path d="M 15,45 L 45,45 L 42,55 L 18,55 Z" opacity="0.7"/>
          <rect x="50" y="48" width="35" height="2" fill="currentColor" opacity="0.4" rx="1" transform="rotate(-5 67.5 49)"/>
          <rect x="50" y="54" width="30" height="2" fill="currentColor" opacity="0.4" rx="1" transform="rotate(3 65 55)"/>
          <circle cx="25" cy="68" r="3" opacity="0.6"/>
          <circle cx="40" cy="65" r="5" opacity="0.5"/>
          <circle cx="60" cy="70" r="4" opacity="0.7"/>
          <path d="M 70,65 L 80,70 L 75,75 Z" opacity="0.6"/>
        </svg>
      );
    
    case 'minimal':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="30" y="35" width="40" height="3" fill="currentColor" opacity="0.8" rx="0.5"/>
          <rect x="35" y="45" width="30" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="35" y="50" width="30" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="35" y="55" width="30" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <circle cx="50" cy="68" r="1.5" fill="currentColor" opacity="0.5"/>
        </svg>
      );
    
    case 'corporate':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="10" y="15" width="80" height="60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="2"/>
          <rect x="10" y="15" width="80" height="12" fill="currentColor" opacity="0.15"/>
          <rect x="18" y="35" width="30" height="4" fill="currentColor" opacity="0.7" rx="1"/>
          <rect x="18" y="42" width="25" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="18" y="47" width="28" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="18" y="52" width="26" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="55" y="35" width="28" height="20" fill="currentColor" opacity="0.2" rx="2"/>
          <rect x="60" y="45" width="5" height="8" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="68" y="42" width="5" height="11" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="76" y="40" width="5" height="13" fill="currentColor" opacity="0.8" rx="0.5"/>
          <rect x="35" y="80" width="30" height="3" fill="currentColor" opacity="0.5" rx="1"/>
        </svg>
      );
    
    case 'vibrant':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="15" y="20" width="70" height="50" fill="currentColor" opacity="0.12" rx="4"/>
          <circle cx="30" cy="35" r="8" fill="currentColor" opacity="0.7"/>
          <circle cx="50" cy="32" r="10" fill="currentColor" opacity="0.8"/>
          <circle cx="70" cy="36" r="7" fill="currentColor" opacity="0.6"/>
          <rect x="20" y="50" width="15" height="3" fill="currentColor" opacity="0.9" rx="1"/>
          <rect x="40" y="50" width="20" height="3" fill="currentColor" opacity="0.85" rx="1"/>
          <rect x="65" y="50" width="12" height="3" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="22" y="58" width="10" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="42" y="58" width="15" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="67" y="58" width="8" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
        </svg>
      );
    
    case 'startup':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <path d="M 50,25 L 55,35 L 45,35 Z" opacity="0.8"/>
          <rect x="48" y="35" width="4" height="15" opacity="0.7"/>
          <circle cx="35" cy="55" r="3" opacity="0.4"/>
          <circle cx="50" cy="50" r="5" opacity="0.6"/>
          <circle cx="65" cy="55" r="3" opacity="0.4"/>
          <path d="M 30,60 Q 50,50 70,60" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
          <rect x="32" y="65" width="36" height="2" fill="currentColor" opacity="0.6" rx="1"/>
          <rect x="35" y="70" width="30" height="2" fill="currentColor" opacity="0.4" rx="1"/>
          <circle cx="25" cy="40" r="1.5" opacity="0.3"/>
          <circle cx="75" cy="42" r="1.5" opacity="0.3"/>
          <circle cx="28" cy="32" r="1" opacity="0.25"/>
        </svg>
      );
    
    case 'professional':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="22" width="60" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" rx="2"/>
          <rect x="25" y="28" width="25" height="4" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="36" width="20" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="25" y="40" width="22" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="25" y="44" width="18" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <line x1="25" y1="52" x2="75" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
          <rect x="25" y="56" width="15" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="25" y="60" width="18" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="55" y="28" width="20" height="15" fill="currentColor" opacity="0.2" rx="1"/>
          <rect x="60" y="56" width="8" height="10" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="70" y="60" width="8" height="6" fill="currentColor" opacity="0.5" rx="0.5"/>
        </svg>
      );
    
    case 'dark':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="15" y="20" width="70" height="50" fill="currentColor" opacity="0.9" rx="3"/>
          <rect x="20" y="26" width="25" height="4" fill="var(--background)" opacity="0.8" rx="1"/>
          <rect x="20" y="34" width="18" height="2" fill="var(--background)" opacity="0.5" rx="0.5"/>
          <rect x="20" y="38" width="20" height="2" fill="var(--background)" opacity="0.4" rx="0.5"/>
          <rect x="20" y="42" width="16" height="2" fill="var(--background)" opacity="0.4" rx="0.5"/>
          <circle cx="65" cy="38" r="10" fill="var(--background)" opacity="0.3"/>
          <circle cx="65" cy="38" r="6" fill="currentColor" opacity="0.9"/>
          <rect x="20" y="55" width="60" height="10" fill="var(--background)" opacity="0.2" rx="1"/>
        </svg>
      );
    
    case 'playful':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <circle cx="30" cy="30" r="8" opacity="0.7"/>
          <rect x="45" y="25" width="30" height="4" opacity="0.8" rx="2" transform="rotate(-3 60 27)"/>
          <rect x="48" y="33" width="25" height="2" opacity="0.5" rx="1" transform="rotate(2 60.5 34)"/>
          <path d="M 20,45 Q 25,50 30,45 T 40,45" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
          <circle cx="55" cy="48" r="4" opacity="0.6"/>
          <circle cx="68" cy="46" r="5" opacity="0.7"/>
          <path d="M 20,60 L 35,58 L 33,68 L 22,65 Z" opacity="0.65"/>
          <rect x="45" y="60" width="20" height="3" opacity="0.6" rx="1.5" transform="rotate(-2 55 61.5)"/>
          <rect x="48" y="67" width="15" height="2" opacity="0.5" rx="1" transform="rotate(3 55.5 68)"/>
          <circle cx="75" cy="65" r="3" opacity="0.5"/>
        </svg>
      );
    
    case 'sophisticated':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="25" y="25" width="50" height="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" rx="1"/>
          <line x1="25" y1="35" x2="75" y2="35" stroke="currentColor" strokeWidth="0.5" opacity="0.25"/>
          <circle cx="30" cy="30" r="2" opacity="0.6"/>
          <rect x="35" y="29" width="15" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <line x1="28" y1="40" x2="72" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
          <line x1="28" y1="45" x2="72" y2="45" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
          <line x1="28" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
          <line x1="28" y1="55" x2="72" y2="55" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
          <rect x="52" y="42" width="18" height="18" fill="currentColor" opacity="0.15" rx="1"/>
          <path d="M 30,70 L 35,75 L 40,70" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          <path d="M 60,70 L 65,75 L 70,70" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
        </svg>
      );
    
    case 'gradient':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'currentColor', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          <rect x="15" y="20" width="70" height="50" fill="url(#grad1)" rx="3"/>
          <rect x="22" y="28" width="28" height="5" fill="var(--background)" opacity="0.9" rx="1"/>
          <rect x="22" y="37" width="20" height="2" fill="var(--background)" opacity="0.6" rx="0.5"/>
          <rect x="22" y="42" width="22" height="2" fill="var(--background)" opacity="0.5" rx="0.5"/>
          <circle cx="65" cy="40" r="12" fill="var(--background)" opacity="0.4"/>
          <rect x="22" y="55" width="56" height="8" fill="var(--background)" opacity="0.3" rx="1"/>
        </svg>
      );
    
    case 'monochrome':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="25" width="60" height="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" rx="1"/>
          <rect x="25" y="32" width="25" height="5" fill="currentColor" opacity="0.9" rx="0.5"/>
          <rect x="25" y="40" width="20" height="2" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="25" y="44" width="22" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="25" y="48" width="18" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          <rect x="55" y="32" width="20" height="20" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="60" y="37" width="10" height="10" fill="var(--background)" opacity="0.9"/>
          <rect x="25" y="58" width="50" height="8" fill="currentColor" opacity="0.3" rx="0.5"/>
        </svg>
      );
    
    case 'futuristic':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <path d="M 20,25 L 80,25 L 75,65 L 25,65 Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
          <path d="M 25,30 L 75,30" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <rect x="28" y="35" width="20" height="3" fill="currentColor" opacity="0.8" rx="0.5" transform="skewX(-5)"/>
          <rect x="28" y="42" width="15" height="2" fill="currentColor" opacity="0.5" rx="0.5" transform="skewX(-5)"/>
          <path d="M 55,38 L 68,38 L 66,48 L 53,48 Z" fill="currentColor" opacity="0.6"/>
          <circle cx="60" cy="43" r="3" fill="var(--background)" opacity="0.8"/>
          <path d="M 28,52 L 50,52 M 32,56 L 48,56" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="30" cy="38" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="70" cy="52" r="1.5" fill="currentColor" opacity="0.6"/>
          <path d="M 30,72 L 35,68 L 40,72 L 35,76 Z" fill="currentColor" opacity="0.5"/>
          <path d="M 60,72 L 65,68 L 70,72 L 65,76 Z" fill="currentColor" opacity="0.5"/>
        </svg>
      );
    
    default:
      return <Presentation className="w-6 h-6" />;
  }
};

// Docs template icon component
const DocsTemplateIcon = ({ type, className }: { type: string; className?: string }) => {
  const baseClasses = cn('w-full h-full', className);
  
  switch (type) {
    case 'prd':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          <rect x="25" y="22" width="30" height="5" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="30" width="20" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <rect x="25" y="38" width="15" height="3" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="44" width="48" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="48" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <rect x="25" y="55" width="18" height="3" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="28" y="60" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <path d="M 29,61 L 30,62.5 L 31.5,60.5" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7"/>
          <rect x="33" y="61" width="20" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="28" y="65" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <rect x="33" y="66" width="18" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <rect x="25" y="73" width="15" height="3" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="78" width="30" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
        </svg>
      );
    
    case 'technical':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          <rect x="25" y="22" width="25" height="4" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="29" width="18" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <rect x="25" y="37" width="48" height="15" fill="currentColor" opacity="0.1" rx="2"/>
          <text x="28" y="44" fontSize="6" opacity="0.5" fontFamily="monospace">{'<code>'}</text>
          <rect x="30" y="46" width="20" height="1" fill="currentColor" opacity="0.4" rx="0.3"/>
          <rect x="32" y="49" width="18" height="1" fill="currentColor" opacity="0.4" rx="0.3"/>
          
          <rect x="25" y="57" width="15" height="2.5" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="62" width="48" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="66" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="70" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <circle cx="72" cy="25" r="3" fill="currentColor" opacity="0.6"/>
          <path d="M 70,25 L 71,26 L 74,23" stroke="var(--background)" strokeWidth="1" fill="none"/>
        </svg>
      );
    
    case 'proposal':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          
          <circle cx="50" cy="28" r="6" fill="currentColor" opacity="0.6"/>
          <path d="M 50,34 L 50,40" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <path d="M 50,40 L 46,45 M 50,40 L 54,45" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          
          <rect x="30" y="50" width="40" height="3" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="32" y="56" width="36" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          
          <rect x="25" y="63" width="22" height="15" fill="currentColor" opacity="0.15" rx="2"/>
          <rect x="29" y="68" width="5" height="6" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="36" y="70" width="5" height="4" fill="currentColor" opacity="0.5" rx="0.5"/>
          
          <rect x="52" y="63" width="22" height="15" fill="currentColor" opacity="0.15" rx="2"/>
          <circle cx="63" cy="70" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d="M 66,73 L 69,76" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
        </svg>
      );
    
    case 'report':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          <rect x="25" y="22" width="35" height="4" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="29" width="25" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <line x1="25" y1="37" x2="75" y2="37" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
          
          <rect x="25" y="42" width="48" height="18" fill="currentColor" opacity="0.08" rx="2"/>
          <rect x="30" y="52" width="5" height="6" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="37" y="50" width="5" height="8" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="44" y="48" width="5" height="10" fill="currentColor" opacity="0.8" rx="0.5"/>
          <rect x="51" y="50" width="5" height="8" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="58" y="53" width="5" height="5" fill="currentColor" opacity="0.6" rx="0.5"/>
          <line x1="25" y1="58" x2="73" y2="58" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          
          <rect x="25" y="66" width="48" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="70" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="74" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="78" width="43" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
        </svg>
      );
    
    case 'guide':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          <rect x="25" y="22" width="28" height="4" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="29" width="20" height="2" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <circle cx="30" cy="41" r="4" fill="currentColor" opacity="0.7"/>
          <text x="28" y="44" fontSize="6" fill="var(--background)" fontWeight="bold">1</text>
          <rect x="37" y="38" width="15" height="2.5" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="37" y="42" width="30" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <circle cx="30" cy="53" r="4" fill="currentColor" opacity="0.7"/>
          <text x="28" y="56" fontSize="6" fill="var(--background)" fontWeight="bold">2</text>
          <rect x="37" y="50" width="18" height="2.5" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="37" y="54" width="32" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <circle cx="30" cy="65" r="4" fill="currentColor" opacity="0.7"/>
          <text x="28" y="68" fontSize="6" fill="var(--background)" fontWeight="bold">3</text>
          <rect x="37" y="62" width="16" height="2.5" fill="currentColor" opacity="0.6" rx="0.5"/>
          <rect x="37" y="66" width="28" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <circle cx="30" cy="77" r="4" fill="currentColor" opacity="0.7"/>
          <text x="28" y="80" fontSize="6" fill="var(--background)" fontWeight="bold">4</text>
          <rect x="37" y="74" width="20" height="2.5" fill="currentColor" opacity="0.6" rx="0.5"/>
        </svg>
      );
    
    case 'wiki':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          
          <path d="M 30,23 L 35,32 L 40,23 L 45,32 L 50,23" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
          
          <rect x="25" y="38" width="25" height="3" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="25" y="44" width="48" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="48" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="52" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <rect x="25" y="59" width="20" height="3" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="65" width="35" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="69" width="38" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <rect x="55" y="38" width="18" height="14" fill="currentColor" opacity="0.12" rx="2"/>
          <circle cx="64" cy="45" r="3" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <path d="M 57,49 L 60,46 L 64,48 L 71,43" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          
          <path d="M 30,78 L 35,75 L 40,78" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
          <path d="M 45,78 L 50,75 L 55,78" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
        </svg>
      );
    
    case 'policy':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          
          <path d="M 48,20 L 50,25 L 52,20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          <circle cx="50" cy="30" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d="M 50,35 L 50,38" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="50" cy="39" r="1" fill="currentColor" opacity="0.6"/>
          
          <rect x="30" y="45" width="40" height="3" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="32" y="51" width="36" height="2" fill="currentColor" opacity="0.5" rx="0.5"/>
          
          <line x1="28" y1="58" x2="72" y2="58" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
          
          <rect x="25" y="62" width="48" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="25" y="66" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="70" width="48" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="74" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="78" width="45" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <rect x="60" y="80" width="15" height="3" fill="currentColor" opacity="0.15" rx="1"/>
          <text x="62" y="83" fontSize="5" opacity="0.5">Sign</text>
        </svg>
      );
    
    case 'meeting-notes':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" rx="3"/>
          
          <circle cx="28" cy="23" r="2" fill="currentColor" opacity="0.6"/>
          <circle cx="35" cy="23" r="2" fill="currentColor" opacity="0.6"/>
          <circle cx="42" cy="23" r="2" fill="currentColor" opacity="0.6"/>
          
          <rect x="25" y="30" width="30" height="3.5" fill="currentColor" opacity="0.8" rx="1"/>
          <rect x="58" y="30" width="15" height="3" fill="currentColor" opacity="0.5" rx="1"/>
          
          <rect x="25" y="38" width="12" height="2.5" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="43" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <rect x="30" y="44" width="25" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="25" y="48" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <path d="M 26,49 L 27,50.5 L 28.5,48.5" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7"/>
          <rect x="30" y="49" width="28" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          <rect x="25" y="53" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <rect x="30" y="54" width="22" height="1.5" fill="currentColor" opacity="0.4" rx="0.5"/>
          
          <rect x="25" y="62" width="15" height="2.5" fill="currentColor" opacity="0.7" rx="0.5"/>
          <rect x="25" y="67" width="35" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="71" width="40" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          <rect x="25" y="75" width="32" height="1.5" fill="currentColor" opacity="0.3" rx="0.5"/>
          
          <circle cx="72" cy="78" r="4" fill="currentColor" opacity="0.6"/>
          <path d="M 70,78 L 71.5,79.5 L 74,77" stroke="var(--background)" strokeWidth="1" fill="none"/>
        </svg>
      );
    
    default:
      return <FileText className="w-6 h-6" />;
  }
};

// Chart icon component
const ChartIcon = ({ type, className }: { type: string; className?: string }) => {
  const baseClasses = cn('w-full h-full', className);
  
  switch (type) {
    case 'bar':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <rect x="15" y="50" width="14" height="35" opacity="0.7" rx="2"/>
          <rect x="35" y="35" width="14" height="50" opacity="0.8" rx="2"/>
          <rect x="55" y="45" width="14" height="40" opacity="0.7" rx="2"/>
          <rect x="75" y="25" width="14" height="60" opacity="0.85" rx="2"/>
          <line x1="10" y1="85" x2="95" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
        </svg>
      );
    
    case 'line':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="none">
          {/* Grid lines */}
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
          <line x1="10" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.1" strokeDasharray="2,2"/>
          <line x1="10" y1="55" x2="90" y2="55" stroke="currentColor" strokeWidth="0.5" opacity="0.1" strokeDasharray="2,2"/>
          <line x1="10" y1="40" x2="90" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.1" strokeDasharray="2,2"/>
          <line x1="10" y1="25" x2="90" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.1" strokeDasharray="2,2"/>
          
          {/* Line path */}
          <path d="M 15,70 L 30,50 L 45,55 L 60,35 L 75,30 L 90,40" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                opacity="0.7"
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"/>
          
          {/* Area fill */}
          <path d="M 15,70 L 30,50 L 45,55 L 60,35 L 75,30 L 90,40 L 90,85 L 15,85 Z" 
                fill="currentColor" 
                opacity="0.1"/>
          
          {/* Data points */}
          <circle cx="15" cy="70" r="3" fill="currentColor" opacity="0.8"/>
          <circle cx="30" cy="50" r="3" fill="currentColor" opacity="0.8"/>
          <circle cx="45" cy="55" r="3" fill="currentColor" opacity="0.8"/>
          <circle cx="60" cy="35" r="3" fill="currentColor" opacity="0.8"/>
          <circle cx="75" cy="30" r="3" fill="currentColor" opacity="0.8"/>
          <circle cx="90" cy="40" r="3" fill="currentColor" opacity="0.8"/>
        </svg>
      );
    
    case 'pie':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Slice 1: 40% (144 degrees) - from top to right-bottom */}
          <path d="M 50,50 L 50,15 A 35,35 0 0,1 78.5,73.5 Z" opacity="0.8" />
          
          {/* Slice 2: 30% (108 degrees) - continuing clockwise */}
          <path d="M 50,50 L 78.5,73.5 A 35,35 0 0,1 21.5,73.5 Z" opacity="0.6" />
          
          {/* Slice 3: 20% (72 degrees) - continuing clockwise */}
          <path d="M 50,50 L 21.5,73.5 A 35,35 0 0,1 28.5,26.5 Z" opacity="0.7" />
          
          {/* Slice 4: 10% (36 degrees) - completing the circle */}
          <path d="M 50,50 L 28.5,26.5 A 35,35 0 0,1 50,15 Z" opacity="0.5" />
          
          {/* Optional donut hole */}
          <circle cx="50" cy="50" r="15" fill="var(--background)" />
        </svg>
      );
    
    case 'scatter':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Grid lines */}
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          <line x1="10" y1="15" x2="10" y2="85" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          
          {/* Data points with varying sizes */}
          <circle cx="22" cy="65" r="3.5" opacity="0.7"/>
          <circle cx="28" cy="48" r="2.5" opacity="0.6"/>
          <circle cx="35" cy="60" r="4" opacity="0.75"/>
          <circle cx="42" cy="42" r="3" opacity="0.65"/>
          <circle cx="48" cy="52" r="3.5" opacity="0.7"/>
          <circle cx="54" cy="35" r="2.5" opacity="0.6"/>
          <circle cx="58" cy="45" r="4" opacity="0.75"/>
          <circle cx="65" cy="30" r="3" opacity="0.65"/>
          <circle cx="70" cy="38" r="3.5" opacity="0.7"/>
          <circle cx="75" cy="25" r="2.5" opacity="0.6"/>
          <circle cx="80" cy="32" r="3" opacity="0.65"/>
          <circle cx="84" cy="20" r="2" opacity="0.5"/>
          
          {/* Trend line */}
          <path d="M 20,70 Q 50,50 85,20" stroke="currentColor" strokeWidth="1" opacity="0.2" fill="none" strokeDasharray="3,3"/>
        </svg>
      );
    
    case 'heatmap':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Grid with varying opacities to simulate heat */}
          <rect x="15" y="20" width="13" height="13" opacity="0.3" rx="2"/>
          <rect x="30" y="20" width="13" height="13" opacity="0.5" rx="2"/>
          <rect x="45" y="20" width="13" height="13" opacity="0.7" rx="2"/>
          <rect x="60" y="20" width="13" height="13" opacity="0.4" rx="2"/>
          <rect x="75" y="20" width="13" height="13" opacity="0.6" rx="2"/>
          
          <rect x="15" y="35" width="13" height="13" opacity="0.4" rx="2"/>
          <rect x="30" y="35" width="13" height="13" opacity="0.8" rx="2"/>
          <rect x="45" y="35" width="13" height="13" opacity="0.9" rx="2"/>
          <rect x="60" y="35" width="13" height="13" opacity="0.7" rx="2"/>
          <rect x="75" y="35" width="13" height="13" opacity="0.5" rx="2"/>
          
          <rect x="15" y="50" width="13" height="13" opacity="0.5" rx="2"/>
          <rect x="30" y="50" width="13" height="13" opacity="0.7" rx="2"/>
          <rect x="45" y="50" width="13" height="13" opacity="0.85" rx="2"/>
          <rect x="60" y="50" width="13" height="13" opacity="0.9" rx="2"/>
          <rect x="75" y="50" width="13" height="13" opacity="0.6" rx="2"/>
          
          <rect x="15" y="65" width="13" height="13" opacity="0.3" rx="2"/>
          <rect x="30" y="65" width="13" height="13" opacity="0.4" rx="2"/>
          <rect x="45" y="65" width="13" height="13" opacity="0.6" rx="2"/>
          <rect x="60" y="65" width="13" height="13" opacity="0.8" rx="2"/>
          <rect x="75" y="65" width="13" height="13" opacity="0.7" rx="2"/>
        </svg>
      );
    
    case 'bubble':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Grid lines */}
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
          <line x1="10" y1="15" x2="10" y2="85" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
          
          {/* Bubbles with better distribution */}
          <circle cx="25" cy="65" r="12" opacity="0.3" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="45" cy="45" r="18" opacity="0.4" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="65" cy="55" r="14" opacity="0.35" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="75" cy="28" r="20" opacity="0.45" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="30" cy="35" r="10" opacity="0.3" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="80" cy="70" r="8" opacity="0.35" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
          <circle cx="55" cy="25" r="6" opacity="0.3" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
        </svg>
      );
    
    case 'wordcloud':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          <text x="50" y="30" fontSize="18" textAnchor="middle" opacity="0.9" fontWeight="700">DATA</text>
          <text x="28" y="45" fontSize="14" textAnchor="middle" opacity="0.7" fontWeight="600">cloud</text>
          <text x="72" y="48" fontSize="12" textAnchor="middle" opacity="0.6" fontWeight="500">analysis</text>
          <text x="50" y="60" fontSize="16" textAnchor="middle" opacity="0.8" fontWeight="600">VISUAL</text>
          <text x="25" y="72" fontSize="10" textAnchor="middle" opacity="0.5">metrics</text>
          <text x="75" y="70" fontSize="11" textAnchor="middle" opacity="0.55" fontWeight="500">insights</text>
          <text x="50" y="80" fontSize="9" textAnchor="middle" opacity="0.4">report</text>
          <text x="35" y="55" fontSize="8" textAnchor="middle" opacity="0.4">big</text>
          <text x="65" y="35" fontSize="8" textAnchor="middle" opacity="0.4">text</text>
        </svg>
      );
    
    case 'stacked':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="currentColor">
          {/* Base line */}
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          
          {/* Stacked bars with gradient effect */}
          <rect x="15" y="60" width="14" height="25" opacity="0.4" rx="1"/>
          <rect x="15" y="42" width="14" height="18" opacity="0.6" rx="1"/>
          <rect x="15" y="30" width="14" height="12" opacity="0.8" rx="1"/>
          
          <rect x="33" y="50" width="14" height="35" opacity="0.4" rx="1"/>
          <rect x="33" y="35" width="14" height="15" opacity="0.6" rx="1"/>
          <rect x="33" y="25" width="14" height="10" opacity="0.8" rx="1"/>
          
          <rect x="51" y="55" width="14" height="30" opacity="0.4" rx="1"/>
          <rect x="51" y="38" width="14" height="17" opacity="0.6" rx="1"/>
          <rect x="51" y="28" width="14" height="10" opacity="0.8" rx="1"/>
          
          <rect x="69" y="45" width="14" height="40" opacity="0.4" rx="1"/>
          <rect x="69" y="28" width="14" height="17" opacity="0.6" rx="1"/>
          <rect x="69" y="18" width="14" height="10" opacity="0.8" rx="1"/>
        </svg>
      );
    
    case 'area':
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="none">
          {/* Grid lines */}
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          
          {/* Multiple area layers */}
          <path d="M 10,75 Q 25,65 40,68 T 70,55 Q 85,50 90,60 L 90,85 L 10,85 Z" 
                fill="currentColor" 
                opacity="0.2"/>
          <path d="M 10,65 Q 30,45 50,50 T 90,35 L 90,85 L 10,85 Z" 
                fill="currentColor" 
                opacity="0.25"/>
          
          {/* Top lines */}
          <path d="M 10,75 Q 25,65 40,68 T 70,55 Q 85,50 90,60" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                opacity="0.5" 
                strokeLinecap="round"/>
          <path d="M 10,65 Q 30,45 50,50 T 90,35" 
                stroke="currentColor" 
                strokeWidth="2" 
                opacity="0.7" 
                strokeLinecap="round"/>
        </svg>
      );
    
    default:
      return <BarChart3 className="w-6 h-6 text-muted-foreground/50" />;
  }
};

export function SunaModesPanel({ 
  selectedMode, 
  onModeSelect, 
  onSelectPrompt, 
  isMobile = false,
  selectedCharts: controlledSelectedCharts,
  onChartsChange,
  selectedOutputFormat: controlledSelectedOutputFormat,
  onOutputFormatChange,
  selectedTemplate: controlledSelectedTemplate,
  onTemplateChange
}: SunaModesPanelProps) {
  const currentMode = selectedMode ? modes.find((m) => m.id === selectedMode) : null;
  const promptCount = isMobile ? 2 : 4;
  
  // Get prompts for a mode (using hardcoded sample prompts)
  const getTranslatedPrompts = (modeId: string): PromptItem[] => {
    if (currentMode) {
      return currentMode.samplePrompts;
    }
    return [];
  };
  
  // State to track current random selection of prompts
  const [randomizedPrompts, setRandomizedPrompts] = useState<PromptItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for PDF preview modal
  const [selectedTemplate, setSelectedTemplate] = useState<{id: string, name: string} | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [preloadedTemplates, setPreloadedTemplates] = useState<Set<string>>(new Set());
  
  // State for multi-select charts (use controlled state if provided)
  const [uncontrolledSelectedCharts, setUncontrolledSelectedCharts] = useState<string[]>([]);
  const selectedCharts = controlledSelectedCharts ?? uncontrolledSelectedCharts;
  const setSelectedCharts = onChartsChange ?? setUncontrolledSelectedCharts;
  
  // State for selected output format (use controlled state if provided)
  const [uncontrolledSelectedOutputFormat, setUncontrolledSelectedOutputFormat] = useState<string | null>(null);
  const selectedOutputFormat = controlledSelectedOutputFormat ?? uncontrolledSelectedOutputFormat;
  const setSelectedOutputFormat = onOutputFormatChange ?? setUncontrolledSelectedOutputFormat;

  // State for selected template (use controlled state if provided)
  const [uncontrolledSelectedTemplateId, setUncontrolledSelectedTemplateId] = useState<string | null>(null);
  const selectedTemplateId = controlledSelectedTemplate ?? uncontrolledSelectedTemplateId;
  const setSelectedTemplateId = onTemplateChange ?? setUncontrolledSelectedTemplateId;

  // Randomize prompts when mode changes or on mount
  useEffect(() => {
    if (selectedMode) {
      const translatedPrompts = getTranslatedPrompts(selectedMode);
      setRandomizedPrompts(getRandomPrompts(translatedPrompts, promptCount));
    }
  }, [selectedMode, promptCount]);
  
  // Reset selections when mode changes
  useEffect(() => {
    setSelectedCharts([]);
    setSelectedOutputFormat(null);
    setSelectedTemplateId(null);
  }, [selectedMode, setSelectedCharts, setSelectedOutputFormat, setSelectedTemplateId]);

  // Handler for refresh button
  const handleRefreshPrompts = () => {
    if (selectedMode) {
      setIsRefreshing(true);
      const translatedPrompts = getTranslatedPrompts(selectedMode);
      setRandomizedPrompts(getRandomPrompts(translatedPrompts, promptCount));
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };
  
  // Handler for chart selection toggle
  const handleChartToggle = (chartId: string) => {
    const newCharts = selectedCharts.includes(chartId) 
      ? selectedCharts.filter(id => id !== chartId)
      : [...selectedCharts, chartId];
    setSelectedCharts(newCharts);
  };
  
  // Handler for output format selection
  const handleOutputFormatSelect = (formatId: string) => {
    const newFormat = selectedOutputFormat === formatId ? null : formatId;
    setSelectedOutputFormat(newFormat);
  };
  
  // Prompt selection is now handled directly in PromptExamples via fullText

  // Handler for template selection (only stores the template ID)
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Handler to preload PDF on hover
  const handlePreloadPdf = (templateId: string) => {
    // Only preload if not already preloaded
    if (preloadedTemplates.has(templateId)) return;

    // Create a prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = getPdfUrl(templateId);
    link.as = 'document';
    document.head.appendChild(link);

    // Track this template as preloaded
    setPreloadedTemplates(prev => new Set(prev).add(templateId));
  };

  // Handler for PDF preview
  const handlePdfPreview = (templateId: string, templateName: string) => {
    setSelectedTemplate({id: templateId, name: templateName});
    setIsPdfLoading(true);
    setIsPdfModalOpen(true);
  };

  const displayedPrompts = randomizedPrompts;

  return (
    <div className="w-full space-y-4">
      {/* Mode Tabs - Only show when no mode is selected */}
      {!selectedMode && (
        <div className="flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="inline-flex gap-2">
            {modes.map((mode) => (
              <Button
                key={mode.id}
                variant="outline"
                size="sm"
                onClick={() => onModeSelect(mode.id)}
                className="flex items-center gap-2 shrink-0 transition-all duration-200 bg-background hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground border-border cursor-pointer"
              >
                {mode.icon}
                <span>{mode.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Sample Prompts - Google List Style (for social media intelligence, creator search) */}
      {selectedMode && displayedPrompts && ['research', 'people'].includes(selectedMode) && (
        <div className="animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex items-center justify-between px-1 mb-2">
            <span></span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshPrompts}
              className="h-7 px-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
            </Button>
          </div>
          <PromptExamples
            prompts={displayedPrompts.map(p => ({
              text: normalizePromptForDisplay(p),
              fullText: getFullPrompt(p)
            }))}
            onPromptClick={(fullPrompt) => onSelectPrompt(fullPrompt)}
            title="Sample Prompts"
            variant="text"
            showTitle={true}
          />
        </div>
      )}

      {/* Sample Prompts - Card Grid Style (for image, slides, data, docs) */}
      {selectedMode && displayedPrompts && !['research', 'people'].includes(selectedMode) && (
        <div className="animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-3">
            <span></span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshPrompts}
              className="h-7 px-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
            </Button>
          </div>
          <PromptExamples
            prompts={displayedPrompts.map(p => ({
              text: normalizePromptForDisplay(p),
              fullText: getFullPrompt(p)
            }))}
            onPromptClick={(fullPrompt) => onSelectPrompt(fullPrompt)}
            title="Sample Prompts"
            variant="card"
            columns={2}
            showTitle={true}
          />
        </div>
      )}

      {/* Mode-specific Options - Only show when a mode is selected */}
      {selectedMode && currentMode?.options && (
        <div className="space-y-3 animate-in fade-in-0 zoom-in-95 duration-300 delay-75">
          <h3 className="text-sm font-medium text-muted-foreground">
            {currentMode.options.title}
          </h3>
          
          {selectedMode === 'image' && (
            <ScrollArea className="w-full">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-2">
                {currentMode.options.items.map((item) => (
                  <Card
                    key={item.id}
                    className="flex flex-col items-center gap-2 cursor-pointer group p-2 hover:bg-primary/5 transition-all duration-200 border border-border rounded-xl overflow-hidden"
                    onClick={() => onSelectPrompt(`Generate an image using ${item.name.toLowerCase()} style`)}
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border/50 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-200 flex items-center justify-center overflow-hidden relative">
                      {item.image ? (
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/70 transition-colors duration-200" />
                      )}
                    </div>
                    <span className="text-xs text-center text-foreground/70 group-hover:text-foreground transition-colors duration-200 font-medium">
                      {item.name}
                    </span>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {selectedMode === 'slides' && (
            <ScrollArea className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-2">
                {currentMode.options.items.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-2 cursor-pointer group p-2 hover:bg-primary/5 transition-all duration-200 border rounded-xl relative",
                      selectedTemplateId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => handleTemplateSelect(item.id)}
                  >
                    <div className="w-full bg-transparent rounded-lg border border-border/50 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-200 overflow-hidden relative aspect-[4/3]">
                      {item.image ? (
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <SlideTemplateIcon 
                          type={item.id} 
                          className="text-foreground/50 group-hover:text-primary/70 transition-colors duration-200" 
                        />
                      )}
                      {/* Preview button overlay */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800 shadow-md"
                        onMouseEnter={() => handlePreloadPdf(item.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePdfPreview(item.id, item.name);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description || ''}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {selectedMode === 'docs' && (
            <ScrollArea className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-2">
                {currentMode.options.items.map((item) => (
                  <Card
                    key={item.id}
                    className="flex flex-col gap-2 cursor-pointer group p-3 hover:bg-primary/5 transition-all duration-200 border border-border rounded-xl"
                    onClick={() =>
                      onSelectPrompt(
                        `Create a ${item.name} document: ${item.description}`
                      )
                    }
                  >
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border/50 flex items-center justify-center p-3">
                      <DocsTemplateIcon 
                        type={item.id} 
                        className="text-foreground/50 group-hover:text-primary/70 transition-colors duration-200" 
                      />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description || ''}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {selectedMode === 'data' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentMode.options.items.map((item) => {
                const isSelected = selectedOutputFormat === item.id;
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all duration-200 group rounded-xl relative",
                      isSelected 
                        ? "bg-primary/10 border-primary border-2 shadow-sm" 
                        : "border border-border hover:bg-primary/5 hover:border-primary/30"
                    )}
                    onClick={() => handleOutputFormatSelect(item.id)}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md z-10"
                        >
                          <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className={cn(
                        "w-full aspect-square rounded-lg flex items-center justify-center p-3 transition-all duration-200",
                        isSelected 
                          ? "bg-primary/15" 
                          : "bg-muted/30 group-hover:bg-muted/50"
                      )}>
                        <OutputFormatIcon 
                          type={item.id} 
                          className={cn(
                            "transition-colors duration-200",
                            isSelected 
                              ? "text-primary" 
                              : "text-foreground/50 group-hover:text-primary/70"
                          )} 
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn(
                          "text-xs font-semibold transition-colors duration-200",
                          isSelected 
                            ? "text-primary" 
                            : "text-foreground/80 group-hover:text-primary"
                        )}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description || ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chart Types Section (for Data mode) - Only show when data is selected */}
      {selectedMode === 'data' && currentMode?.chartTypes && (
        <div className="space-y-3 animate-in fade-in-0 zoom-in-95 duration-300 delay-150">
          <h3 className="text-sm font-medium text-muted-foreground">
            Preferred Charts
          </h3>
          <ScrollArea className="w-full">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-2">
              {currentMode.chartTypes.items.map((chart) => {
                const isSelected = selectedCharts.includes(chart.id);
                return (
                  <motion.div
                    key={chart.id}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Card
                      className={cn(
                        "flex flex-col items-center gap-2 cursor-pointer group p-3 transition-all duration-200 rounded-xl relative",
                        isSelected 
                          ? "bg-primary/10 border-primary border-2 shadow-sm" 
                          : "border border-border hover:bg-primary/5 hover:border-primary/30"
                      )}
                      onClick={() => handleChartToggle(chart.id)}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md z-10"
                          >
                            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className={cn(
                        "w-full aspect-square rounded-lg flex items-center justify-center p-2.5 transition-all duration-200",
                        isSelected 
                          ? "bg-primary/15" 
                          : "bg-muted/20 group-hover:bg-muted/35"
                      )}>
                        <ChartIcon 
                          type={chart.id} 
                          className={cn(
                            "transition-colors duration-200",
                            isSelected 
                              ? "text-primary" 
                              : "text-foreground/60 group-hover:text-primary"
                          )} 
                        />
                      </div>
                      <span className={cn(
                        "text-xs text-center transition-colors duration-200 font-medium",
                        isSelected 
                          ? "text-primary" 
                          : "text-foreground/70 group-hover:text-foreground"
                      )}>
                        {chart.name}
                      </span>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* PDF Preview Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              Template Preview: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {selectedTemplate && (
              <div className="relative">
                {/* Loading overlay */}
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading preview...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={getPdfUrl(selectedTemplate.id)}
                  className="w-full h-[70vh] border rounded-lg"
                  title={`${selectedTemplate.name} template preview`}
                  onLoad={() => setIsPdfLoading(false)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}


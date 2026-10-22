/**
 * SEO & Schema.org JSON-LD Structured Data for Candlesticks Academy
 * (https://candlesticksacademy.online)
 */

export const SCHEMA_ORGANIZATION = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "FinancialService"],
      "@id": "https://candlesticksacademy.online/#organization",
      "name": "Candlesticks Academy",
      "alternateName": "Candlesticks Trading Academy",
      "url": "https://candlesticksacademy.online",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://candlesticksacademy.online/#logo",
        "url": "https://candlesticksacademy.online/assets/aistudio/CA-02_8e3c67eb.png",
        "caption": "Candlesticks Academy Logo",
        "width": 512,
        "height": 512
      },
      "image": "https://candlesticksacademy.online/assets/aistudio/CA-02_8e3c67eb.png",
      "description": "Candlesticks Academy is a premier institutional Forex & Gold (XAU/USD) trading mentorship academy founded by Pastor Mike. Offering structured curriculum, daily live trading sessions, multi-TP VIP signals, and automated Exness copy trading.",
      "founder": {
        "@type": "Person",
        "name": "Pastor Mike",
        "jobTitle": "Founder & Lead Mentor",
        "image": "https://candlesticksacademy.online/ceo.png"
      },
      "sameAs": [
        "https://one.exness-track.com/a/9s8109d94y"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://candlesticksacademy.online/#website",
      "url": "https://candlesticksacademy.online",
      "name": "Candlesticks Academy",
      "publisher": {
        "@id": "https://candlesticksacademy.online/#organization"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://candlesticksacademy.online/courses?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Course",
      "@id": "https://candlesticksacademy.online/#course-forex-mastery",
      "name": "Institutional Forex & Gold Trading Mastery Program",
      "description": "Comprehensive 4-tier trading curriculum covering Forex Foundations, Smart Money Structure, Institutional Order Flow, and Advanced Gold (XAU/USD) Execution.",
      "provider": {
        "@id": "https://candlesticksacademy.online/#organization"
      },
      "educationalLevel": "Beginner to Advanced",
      "coursePrerequisites": "None",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "category": "1-Month Free Trial via Exness Partner Link"
      },
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
        "courseWorkload": "PT20H"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://candlesticksacademy.online/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Candlesticks Academy?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Candlesticks Academy is an online Forex and Gold (XAU/USD) mentorship platform founded by Pastor Mike, offering structured curriculum, daily live London/NY trading rooms, VIP signals, and 1-on-1 mentorship."
          }
        },
        {
          "@type": "Question",
          "name": "How do I claim the 1-Month Free Full Academy Trial?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Register your trading account through the official Candlesticks Exness partner link (Code: 9s8109d94y) and fund your account with a minimum of $50 USD to unlock full access to courses, live sessions, and VIP signals."
          }
        },
        {
          "@type": "Question",
          "name": "Can I copy Pastor Mike's trading signals automatically?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Students on the $100 Permanent VIP tier unlock automated 1-click Exness copy trading along with private 1-on-1 mentorship and $500 Account Management."
          }
        }
      ]
    }
  ]
};

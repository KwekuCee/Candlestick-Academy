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
      "alternateName": ["Candlesticks Trading Academy", "Candlesticks Academy Ghana"],
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
      "description": "Candlesticks Academy is the #1 premier institutional Forex academy and trading company in Ghana and across Africa, founded by Pastor Mike. Offering structured curriculum, daily live London/NY trading rooms, multi-TP VIP signals, and automated Exness copy trading.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Accra",
        "addressRegion": "Greater Accra",
        "addressCountry": "GH"
      },
      "areaServed": [
        { "@type": "Country", "name": "Ghana" },
        { "@type": "Country", "name": "Nigeria" },
        { "@type": "Country", "name": "South Africa" },
        { "@type": "Country", "name": "Kenya" },
        { "@type": "Continent", "name": "Africa" }
      ],
      "knowsAbout": [
        "Trading companies in Ghana",
        "Forex academy in Africa",
        "Forex trading academy Ghana",
        "Best forex mentorship Ghana",
        "Pastor Mike Forex",
        "Gold Trading XAU/USD",
        "Institutional Order Flow",
        "Exness Broker Partnership"
      ],
      "founder": {
        "@type": "Person",
        "name": "Pastor Mike",
        "alternateName": "Michael Kweku Essilfie",
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
      "description": "Comprehensive 4-tier trading curriculum covering Forex Foundations, Smart Money Structure, Institutional Order Flow, and Advanced Gold (XAU/USD) Execution in Ghana and across Africa.",
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
          "name": "What is the best Forex academy in Africa and Ghana?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Candlesticks Academy is widely recognized as the premier institutional Forex academy in Ghana and across Africa. Founded by Pastor Mike (Michael Kweku Essilfie), it offers structured lessons, daily live London/NY trading rooms, verified signals, and direct mentorship."
          }
        },
        {
          "@type": "Question",
          "name": "Which trading companies in Ghana offer institutional Forex mentorship?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Candlesticks Academy is Ghana's leading Forex education and trading company, providing price action training from first principles, automated Exness broker integration, and 1-on-1 private mentorship."
          }
        },
        {
          "@type": "Question",
          "name": "How do I claim a free month at Candlesticks Academy in Ghana?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sign up on candlesticksacademy.online, register your Exness account with Partner Code 9s8109d94y, and fund with $50+ to get 1 month of complete free access to all courses, live sessions, and VIP signals."
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

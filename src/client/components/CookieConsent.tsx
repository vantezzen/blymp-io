import * as React from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { useHistory } from "react-router-dom";

const CookieConsent = () => {
  const history = useHistory();
  React.useEffect(() => {
    if (typeof window == "undefined") return;
    require("vanilla-cookieconsent");
    const cookieconsent = window.initCookieConsent();
    window.cco = cookieconsent;
    window.openPrivacyPolicy = () => {
      console.log("Opening privacy policy");
      history.push("/privacy");

      window.cco.hide();
      window.location.reload();
    };
    cookieconsent.run({
      current_lang: "en",
      force_consent: true,
      page_scripts: true,
      revision: 0,

      onAccept: (cookie: any) => {
        if (cookie.level.includes("analytics")) {
          console.log("Yay");
        }
      },

      gui_options: {
        consent_modal: {
          layout: "box",
          position: "middle center",
          transition: "slide",
        },
        settings_modal: {
          layout: "box",
          // position: 'left',
          transition: "slide",
        },
      },

      languages: {
        en: {
          consent_modal: {
            title: "We use cookies 🍪",
            description:
              'Hi, this website uses cookies to ensure its proper operation and to understand how you interact with it. The latter will be set only after consent. <button type="button" data-cc="c-settings" class="cc-link">Let me choose</button>',
            primary_btn: {
              text: "Accept all",
              role: "accept_all", // 'accept_selected' or 'accept_all'
            },
            secondary_btn: {
              text: "Reject all",
              role: "accept_necessary", // 'settings' or 'accept_necessary'
            },
          },
          settings_modal: {
            title: "Cookie preferences",
            save_settings_btn: "Save settings",
            accept_all_btn: "Accept all",
            reject_all_btn: "Reject all",
            close_btn_label: "Close",
            cookie_table_headers: [
              { col1: "Name" },
              { col2: "Domain" },
              { col3: "Expiration" },
              { col4: "Description" },
            ],
            blocks: [
              {
                title: "Cookie usage 📢",
                description:
                  'We use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <button onclick="window.openPrivacyPolicy()" class="cc-link">privacy policy</button>.',
              },
              {
                title: "Strictly necessary cookies",
                description:
                  "These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly",
                toggle: {
                  value: "necessary",
                  enabled: true,
                  readonly: true, // cookie categories with readonly=true are all treated as "necessary cookies"
                },
              },
              {
                title: "Performance and Analytics cookies",
                description:
                  "These cookies allow the website to remember the choices you have made in the past",
                toggle: {
                  value: "analytics", // your cookie category
                  enabled: false,
                  readonly: false,
                },
                cookie_table: [
                  // list of all expected cookies
                  {
                    col1: "^_ga", // match all cookies starting with "_ga"
                    col2: "google.com",
                    col3: "2 years",
                    col4: "Cookies from Google Analytics that store information about your browser",
                    is_regex: true,
                  },
                  {
                    col1: "_gid",
                    col2: "google.com",
                    col3: "1 day",
                    col4: "Cookie from Google that stores information about your current session",
                  },
                ],
              },
              {
                title: "Advertisement and Targeting cookies",
                description:
                  "These cookies collect information about how you use the website, which pages you visited and which links you clicked on. All of the data is anonymized and cannot be used to identify you",
                toggle: {
                  value: "targeting",
                  enabled: false,
                  readonly: false,
                },
                cookie_table: [
                  // list of all expected cookies
                  {
                    col1: "medianet", // match all cookies starting with "_ga"
                    col2: "media.net",
                    col3: "2 years",
                    col4: "Cookies from media.net to help show relevant ads",
                    is_regex: true,
                  },
                ],
              },
            ],
          },
        },
      },
    });
  }, []);

  return <></>;
};

export default CookieConsent;

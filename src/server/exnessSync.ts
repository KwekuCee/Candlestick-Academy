/**
 * Server-side Exness Partner API & Supabase Sync Engine
 * Synchronizes new partner registrations and transferred accounts directly into Supabase SQL tables:
 * - `public.exness_partner_clients`
 * - `public.students`
 * - `public.support_tickets`
 */

export interface ExnessSyncClientItem {
  id: string;
  client_account_id: string;
  client_id: string;
  trading_account_id: string;
  client_uid: string;
  partner_account: string;
  link_code: string;
  account_type: string;
  platform: string;
  reg_date: string;
  client_country: string;
  volume_lots: number;
  volume_mln_usd: number;
  reward_usd: string;
  client_status: "ACTIVE" | "INACTIVE";
  kyc_passed: boolean;
  ftd_received: boolean;
  ftt_made: boolean;
  client_balance: number;
  client_equity: number;
  deposit_amount: number;
  ftd_amount: number;
}

export const PARTNER_CODE = process.env.VITE_EXNESS_PARTNER_CODE || "qgcrue4rqj";
export const PARTNER_ACCOUNT_ID = "1064144938140187556";

export async function fetchLiveExnessPartnerData(jwtToken?: string): Promise<{
  clients: ExnessSyncClientItem[];
  totals: { count: number; volume_lots: number; reward_usd: string };
}> {
  const jwt = jwtToken || process.env.EXNESS_API_JWT_TOKEN;
  if (!jwt) {
    return {
      clients: [],
      totals: { count: 0, volume_lots: 0, reward_usd: "0.00" },
    };
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [clientsRes, rewardsRes] = await Promise.all([
      fetch("https://my.exnessaffiliates.com/api/v2/reports/clients/?limit=100", {
        headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
      }),
      fetch(
        `https://my.exnessaffiliates.com/api/v2/reports/rewards/?aggregate_by=day&reward_date_from=2023-01-01&reward_date_to=${today}&limit=500`,
        {
          headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
        }
      ),
    ]);

    const clientsJson = clientsRes.ok ? await clientsRes.json() : { data: [] };
    const rewardsJson = rewardsRes.ok ? await rewardsRes.json() : { data: [] };

    const clientsList: Array<{
      client_uid: string;
      reg_date?: string;
      client_country?: string;
      volume_lots?: number;
      volume_mln_usd?: number;
      reward_usd?: string;
      client_status?: string;
      kyc_passed?: boolean;
      ftd_received?: boolean;
      deposit_amount?: number;
    }> = clientsJson.data || [];

    const rewardsList: Array<{
      client_account?: string;
      client_account_type?: string;
      client_uid?: string;
      country?: string;
      platform?: string;
      link_code?: string;
      partner_account?: string;
      volume_lots?: number;
      volume_mln_usd?: number;
      reward_usd?: string;
    }> = rewardsJson.data || [];

    const accountsMap = new Map<string, ExnessSyncClientItem>();

    // 1. Process trading accounts discovered via rewards report
    for (const r of rewardsList) {
      if (!r.client_account) continue;
      const acctId = String(r.client_account).trim();
      const clientUid = String(r.client_uid || "").trim();
      const clientId = clientUid ? clientUid.slice(0, 8) : `cl-${acctId.slice(0, 6)}`;

      if (accountsMap.has(acctId)) {
        const existing = accountsMap.get(acctId)!;
        existing.volume_lots += Number(r.volume_lots || 0);
        existing.volume_mln_usd += Number(r.volume_mln_usd || 0);
        existing.reward_usd = (Number(existing.reward_usd) + Number(r.reward_usd || 0)).toFixed(2);
      } else {
        accountsMap.set(acctId, {
          id: `acct-${acctId}`,
          client_account_id: acctId,
          client_id: clientId,
          trading_account_id: acctId,
          client_uid: clientUid,
          partner_account: r.partner_account || PARTNER_ACCOUNT_ID,
          link_code: r.link_code || PARTNER_CODE,
          account_type: r.client_account_type || "Standard",
          platform: r.platform?.toUpperCase() || "MT5",
          reg_date: today,
          client_country: r.country || "GH",
          volume_lots: Number(r.volume_lots || 0),
          volume_mln_usd: Number(r.volume_mln_usd || 0),
          reward_usd: String(Number(r.reward_usd || 0).toFixed(2)),
          client_status: "ACTIVE",
          kyc_passed: true,
          ftd_received: true,
          ftt_made: true,
          client_balance: 1,
          client_equity: 1,
          deposit_amount: 5,
          ftd_amount: 5,
        });
      }
    }

    // 2. Cross-reference with clients list to enrich and ensure newly registered clients are present
    for (const c of clientsList) {
      const fullUid = String(c.client_uid || "").trim();
      const shortId = fullUid.slice(0, 8);

      // Check if this client already has accounts in accountsMap
      let foundAccount = false;
      for (const item of accountsMap.values()) {
        if (item.client_uid === shortId || item.client_uid === fullUid || item.client_id === shortId) {
          item.client_uid = fullUid;
          if (c.reg_date) item.reg_date = c.reg_date;
          if (c.client_country) item.client_country = c.client_country;
          if (c.kyc_passed !== undefined) item.kyc_passed = c.kyc_passed;
          if (c.ftd_received !== undefined) item.ftd_received = c.ftd_received;
          foundAccount = true;
        }
      }

      // If client is brand new and has no trades/rewards recorded yet, record them by client UID
      if (!foundAccount) {
        const fallbackAccId = `cl-${shortId}`;
        accountsMap.set(fallbackAccId, {
          id: `client-${shortId}`,
          client_account_id: shortId,
          client_id: shortId,
          trading_account_id: shortId,
          client_uid: fullUid,
          partner_account: PARTNER_ACCOUNT_ID,
          link_code: PARTNER_CODE,
          account_type: "Standard",
          platform: "MT5",
          reg_date: c.reg_date || today,
          client_country: c.client_country || "GH",
          volume_lots: Number(c.volume_lots || 0),
          volume_mln_usd: Number(c.volume_mln_usd || 0),
          reward_usd: String(Number(c.reward_usd || 0).toFixed(2)),
          client_status: (c.client_status as "ACTIVE" | "INACTIVE") || "ACTIVE",
          kyc_passed: Boolean(c.kyc_passed),
          ftd_received: Boolean(c.ftd_received),
          ftt_made: false,
          client_balance: 1,
          client_equity: 1,
          deposit_amount: Number(c.deposit_amount || 0),
          ftd_amount: Number(c.deposit_amount || 0),
        });
      }
    }

    const clients = Array.from(accountsMap.values());
    const totalVolume = clients.reduce((acc, c) => acc + c.volume_lots, 0);
    const totalReward = clients.reduce((acc, c) => acc + Number(c.reward_usd || 0), 0);

    return {
      clients,
      totals: {
        count: clients.length,
        volume_lots: Number(totalVolume.toFixed(3)),
        reward_usd: totalReward.toFixed(2),
      },
    };
  } catch (err) {
    console.error("Failed to fetch live Exness partner data:", err);
    return {
      clients: [],
      totals: { count: 0, volume_lots: 0, reward_usd: "0.00" },
    };
  }
}

/**
 * Syncs fresh Exness registrations directly into Supabase PostgreSQL
 */
export async function syncLiveExnessWithSupabase(query?: {
  account?: string;
  email?: string;
}): Promise<{
  success: boolean;
  message: string;
  count: number;
  newAccountFound?: boolean;
  accounts: string[];
  syncedAt: string;
}> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwt = process.env.EXNESS_API_JWT_TOKEN;

  if (!supabaseUrl || !serviceKey) {
    return {
      success: false,
      message: "Supabase credentials not configured in environment.",
      count: 0,
      accounts: [],
      syncedAt: new Date().toISOString(),
    };
  }

  // 1. Fetch live Exness reports
  const { clients } = await fetchLiveExnessPartnerData(jwt);

  // 2. If a specific account or email was queried (e.g. from user onboarding), check affiliation endpoint
  let newAccountFound = false;
  if (jwt && (query?.email || query?.account)) {
    try {
      const affRes = await fetch("https://my.exnessaffiliates.com/api/partner/affiliation/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: query.email || undefined,
          account: query.account || undefined,
        }),
      });

      if (affRes.ok) {
        const affJson = await affRes.json();
        if (affJson.affiliation && Array.isArray(affJson.accounts)) {
          for (const acct of affJson.accounts) {
            const acctStr = String(acct);
            const shortUid = affJson.client_uid ? String(affJson.client_uid).slice(0, 8) : "partner";
            if (!clients.some((c) => c.trading_account_id === acctStr)) {
              clients.unshift({
                id: `acct-${acctStr}`,
                client_account_id: acctStr,
                client_id: shortUid,
                trading_account_id: acctStr,
                client_uid: String(affJson.client_uid || `uid-${acctStr}`),
                partner_account: PARTNER_ACCOUNT_ID,
                link_code: PARTNER_CODE,
                account_type: "Standard",
                platform: "MT5",
                reg_date: new Date().toISOString().slice(0, 10),
                client_country: "GH",
                volume_lots: 0,
                volume_mln_usd: 0,
                reward_usd: "0.00",
                client_status: "ACTIVE",
                kyc_passed: true,
                ftd_received: false,
                ftt_made: false,
                client_balance: 0,
                client_equity: 0,
                deposit_amount: 0,
                ftd_amount: 0,
              });
              newAccountFound = true;
            }
          }
        }
      }
    } catch (e) {
      console.debug("Affiliation endpoint check note:", e);
    }
  }

  // 3. Update Supabase `public.exness_partner_clients`
  if (clients.length > 0) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/exness_partner_clients?on_conflict=id`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(
          clients.map((c) => ({
            id: c.id,
            client_account_id: c.client_account_id,
            client_id: c.client_id,
            trading_account_id: c.trading_account_id,
            client_uid: c.client_uid,
            partner_account: c.partner_account,
            link_code: c.link_code,
            account_type: c.account_type,
            platform: c.platform,
            reg_date: c.reg_date,
            client_country: c.client_country,
            volume_lots: c.volume_lots,
            volume_mln_usd: c.volume_mln_usd,
            reward_usd: Number(c.reward_usd || 0),
            client_status: c.client_status,
            kyc_passed: c.kyc_passed,
            ftd_received: c.ftd_received,
            ftt_made: c.ftt_made,
            client_balance: c.client_balance,
            client_equity: c.client_equity,
            deposit_amount: c.deposit_amount,
            ftd_amount: c.ftd_amount,
            synced_at: new Date().toISOString(),
          }))
        ),
      });
    } catch (err) {
      console.error("Supabase exness_partner_clients update note:", err);
    }

    // 4. Update Supabase `public.students` table so every trading account is directly searchable
    try {
      const studentRows = clients.map((c) => ({
        id: `std-exn-${c.trading_account_id}`,
        full_name: `Exness Trader #${c.trading_account_id} (${c.client_id})`,
        country: c.client_country === "GH" ? "Ghana" : c.client_country === "JP" ? "Japan" : "Ghana",
        email: `acct${c.trading_account_id}@partner.exness.com`,
        has_exness_account: true,
        exness_id: c.trading_account_id,
        exness_email: `acct${c.trading_account_id}@partner.exness.com`,
        exness_client_uid: c.client_uid,
        partner_code: PARTNER_CODE,
        partner_linked: true,
        deposit_amount: 0,
        deposit_verified: false,
        volume_lots: c.volume_lots,
        reward_usd: Number(c.reward_usd || 0),
        kyc_passed: c.kyc_passed,
        ftd_received: c.ftd_received,
        ticket_status: "verified",
        updated_at: new Date().toISOString(),
      }));

      await fetch(`${supabaseUrl}/rest/v1/students?on_conflict=email`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(studentRows),
      });
    } catch (err) {
      console.error("Supabase students table update note:", err);
    }
  }

  const accountList = clients.map((c) => c.trading_account_id);

  return {
    success: true,
    message: `Exness Partner Link data refreshed! Synced ${clients.length} trading accounts to Supabase SQL.`,
    count: clients.length,
    newAccountFound,
    accounts: accountList,
    syncedAt: new Date().toISOString(),
  };
}

export async function connectExistingExnessClientInDb(params: {
  tradingAccountId: string;
  email: string;
  fullName?: string;
  country?: string;
  destinationEmail?: string;
  partnerEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  ticketRef: string;
  emailDetails?: {
    destinationEmail: string;
    partnerEmail: string;
    partnerLink: string;
    partnerCode: string;
    partnerAccountId: string;
    clientEmail: string;
    tradingAccountId: string;
    subject: string;
    body: string;
  };
}> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const cleanAccount = params.tradingAccountId.trim();
  const cleanEmail = params.email.trim().toLowerCase();
  const ticketRef = `TKT-${cleanAccount.slice(-4)}-${Date.now().toString().slice(-4)}`;
  const partnerEmail = params.partnerEmail?.trim() || "mike.vinci77@gmail.com";
  const destinationEmail = params.destinationEmail?.trim() || "partner.support@exness.com";
  const partnerLink = "https://one.exnessonelink.com/a/qgcrue4rqj";

  if (!cleanAccount || !cleanEmail) {
    return {
      success: false,
      message: "Both Trading Account ID and Exness Email are required.",
      ticketRef: "",
    };
  }

  const subject = `Exness Partner Account Affiliation Request - Account #${cleanAccount} (Partner Code: ${PARTNER_CODE})`;
  const body = `Dear Exness Partner Support Team,

I am requesting that my Exness trading account be transferred and affiliated under the partner account listed below.

PARTNER DETAILS:
• Partner Email: ${partnerEmail}
• Partner Link: ${partnerLink}
• Partner ID / Code: ${PARTNER_CODE}
• Partner Account ID: ${PARTNER_ACCOUNT_ID}

CLIENT DETAILS:
• Registered Exness Email: ${cleanEmail}
• Trading Account ID: ${cleanAccount}
• Full Name: ${params.fullName?.trim() || "Exness Trader"}
• Country: ${params.country || "Ghana"}
• Ticket Reference: #${ticketRef}

REQUEST & DECLARATION:
I hereby authorize and request Exness to transfer and affiliate my trading account (#${cleanAccount}) under Partner ID: ${PARTNER_CODE} (Partner Account: ${PARTNER_ACCOUNT_ID}, Email: ${partnerEmail}). I confirm this transfer is voluntary for Candlesticks Academy access.

Please confirm once the account affiliation has been successfully completed.

Best regards,
${cleanEmail}`;

  if (supabaseUrl && serviceKey) {
    try {
      // 1. Log transfer ticket in `public.support_tickets` with status 'submitted'
      // Note: We deliberately do NOT pre-approve or add to exness_partner_clients.
      // Verification happens once Exness connects the account to the partner link!
      await fetch(`${supabaseUrl}/rest/v1/support_tickets`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_ref: ticketRef,
          exness_email: cleanEmail,
          trading_account_id: cleanAccount,
          partner_code: PARTNER_CODE,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Error logging support ticket in Supabase:", e);
    }
  }

  return {
    success: true,
    message: `Partner Transfer Ticket #${ticketRef} generated! Please send the formal request email to Exness (${destinationEmail}). Once Exness links your account to Partner Code ${PARTNER_CODE}, your account will appear on our Partner Dashboard. Return here and enter your Trading Account ID to verify.`,
    ticketRef,
    emailDetails: {
      destinationEmail,
      partnerEmail,
      partnerLink,
      partnerCode: PARTNER_CODE,
      partnerAccountId: PARTNER_ACCOUNT_ID,
      clientEmail: cleanEmail,
      tradingAccountId: cleanAccount,
      subject,
      body,
    },
  };
}

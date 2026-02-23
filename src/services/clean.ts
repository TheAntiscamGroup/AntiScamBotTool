import isEmpty from "just-is-empty";

export async function CleanThreadChain(env: Env, ctx: ExecutionContext) {
  const bannedAccounts: string[] = [];
  let successfulDeletes: number = 0;
  let manualDelete: boolean = true;
  // Clean up the USER_TO_THREAD KV table if the user reported is banned.
  if (env.REPORT_SETTINGS.thread_by_user == true) {
    let options = { cursor: "", limit: 200 };
    // loop forever until we're done.
    while (true) {
      // list all the entries in the KV table
      const response = await env.REPORT_THREAD_CHAIN.list(options);
      // run through all the objects in the response
      for (const userEntry of response.keys) {
        try {
          // Check our API to see if that user is banned
          const apiResponse = await (env.API_SERVICE as CheckAccountService).checkAccount(userEntry.name);
          if (apiResponse.valid && apiResponse.banned) {
            // They are banned, prepare to remove them from the KV.
            console.log(`adding ${userEntry.name}`);
            bannedAccounts.push(userEntry.name);
          }
        } catch(err) {
          console.error(`Encountered an error ${err} while trying to delete user ${userEntry} from the KV table`);
          continue;
        }
      }
      // loop again if we're not at the end of the KV table
      if (response.list_complete !== true)
        options.cursor = response.cursor;
      else
        break;
    }
    const canBulkDelete: boolean = (!isEmpty(env.BULK_KV_API_TOKEN) && !isEmpty(env.THREAD_CHAIN_KV_ID) && !isEmpty(env.CF_ACCOUNT_ID));
    if (canBulkDelete && bannedAccounts.length > 0) {
      const bulkDelete = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.THREAD_CHAIN_KV_ID}/bulk/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.BULK_KV_API_TOKEN}`
          },
          body: JSON.stringify(bannedAccounts)
        });
      if (bulkDelete.ok) {
        const result: any = await bulkDelete.json();
        if (result.success) {
          successfulDeletes = result.result.successful_key_count;
          console.log(`Keys failed to delete: ${result.result.unsuccessful_keys}`);
          manualDelete = false;
        }
      }
    }

    // We can't use bulk delete or it otherwise failed.
    if (manualDelete) {
      console.log(`Attempting to manually delete ${bannedAccounts.length}`);
      for (const accountToDelete of bannedAccounts) {
        ctx.waitUntil(env.REPORT_THREAD_CHAIN.delete(accountToDelete));
        ++successfulDeletes;
      }
    }
    console.log(`Finished processing cleanup of ${successfulDeletes}/${bannedAccounts.length}`);
  }
  return {success: successfulDeletes, total: bannedAccounts.length};
}
export const config: Settings = {
  // If specified, allows for injecting commands
  // into an guild.
  CONTROL_GUILD: "1155997672667365406",

  APP_SETTINGS: {
    // if the tool should redirect to install on invalid endpoints
    redirect_to_install: true,
    // if the /clean endpoint is exposed (allows for force cleaning of KV entries)
    can_use_clean: false,
    // other discord accounts ids that are related to this app, this app cannot be used on these accounts
    accounts: ["1152057650226401320", "1176299970568147057", "1226254289161158776", "1443130827662823557"]
  },

  COMMAND_SETTINGS: {
    // if all usages of commands should be logged
    log_run: false,
    // if errors raised by this tool should be logged
    log_errors: true,
    // if this tool should check to see if the user is on a forbid list before executing
    use_forbid_list: true,
    // if the tool should also register commands that start with "MOD:", they will be only usable by those that have access to the audit log
    install_mod_commands: true,
  },

  REPORT_SETTINGS: {
    // if all users can report, allow list unneeded. List uses the CAN_REPORT KV
    allow_all: true,
    // if messages can be reported from servers.
    // The CONTROL_GUILD setting MUST BE SET to use this as true
    can_report_in_servers: true,
    // if banned accounts can continue to be reported until cleanup
    report_banned: true,
    // if reports should be threaded/bundled by the reported user
    // otherwise each report will create a new thread
    thread_by_user: true,
    // time of how long we should keep chain threads active. only used if thread_by_user is false
    message_source_lifetime: "1d 6h 30m"
  },

  LOOKUP_SETTINGS: {
    // if /lookup is enabled. Usually disabled to prevent mistakes
    slash_enabled: false,
    // if all users can lookup accounts, allow list unneeded. If false, list uses the CAN_REPORT KV
    allow_all: true
  }
};
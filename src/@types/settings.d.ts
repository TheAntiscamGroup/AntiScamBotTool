declare interface Settings {
  CONTROL_GUILD?: string;
  APP_SETTINGS: ApplicationSettings;
  COMMAND_SETTINGS: CommandSettings;
  REPORT_SETTINGS: ReportSettings;
  LOOKUP_SETTINGS: LookupSettings;
};

declare interface ApplicationSettings {
  redirect_to_install: boolean;
  can_use_clean: boolean;
  accounts?: string[];
};

declare interface CommandSettings {
  log_run: boolean;
  log_errors: boolean;
  use_forbid_list: boolean;
  install_mod_commands: boolean;
};

declare interface ReportSettings {
  allow_all: boolean;
  report_banned: boolean;
  thread_by_user: boolean;
  can_report_in_servers: boolean;
  message_source_lifetime?: string;
};

declare interface LookupSettings {
  slash_enabled: boolean;
  allow_all: boolean;
};
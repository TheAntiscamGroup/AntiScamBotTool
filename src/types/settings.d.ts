declare type Settings = {
  CONTROL_GUILD?: string;
  APP_SETTINGS: ApplicationSettings;
  COMMAND_SETTINGS: CommandSettings;
  REPORT_SETTINGS: ReportSettings;
  LOOKUP_SETTINGS: LookupSettings;
};

declare type ApplicationSettings = {
  redirect_to_install: boolean;
  can_use_clean: boolean;
  accounts?: string[];
};

declare type CommandSettings = {
  log_run: boolean;
  log_errors: boolean;
  use_forbid_list: boolean;
  install_mod_commands: boolean;
};

declare type ReportSettings = {
  allow_all: boolean;
  report_banned: boolean;
  thread_by_user: boolean;
  can_report_in_servers: boolean;
  message_source_lifetime?: string;
};

declare type LookupSettings = {
  slash_enabled: boolean;
  allow_all: boolean;
};
declare type ApplicationSettings = {
  redirect_to_install: boolean;
  accounts?: string[];
};

declare type CommandSettings = {
  log_run: boolean;
  log_errors: boolean;
  use_forbid_list: boolean;
};

declare type ReportSettings = {
  allow_all: boolean;
  report_banned: boolean;
  use_message_source: boolean;
  message_source_lifetime?: string;
};

declare type LookupSettings = {
  slash_enabled: boolean;
};
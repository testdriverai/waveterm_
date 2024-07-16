module github.com/wavetermdev/thenextwave

go 1.22

toolchain go1.22.1

require (
	github.com/alexflint/go-filemutex v1.3.0
	github.com/creack/pty v1.1.18
	github.com/fsnotify/fsnotify v1.7.0
	github.com/golang-migrate/migrate/v4 v4.17.1
	github.com/google/uuid v1.4.0
	github.com/gorilla/handlers v1.5.2
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/websocket v1.5.0
	github.com/jmoiron/sqlx v1.4.0
	github.com/kevinburke/ssh_config v1.2.0
	github.com/mattn/go-sqlite3 v1.14.22
	github.com/mitchellh/mapstructure v1.5.0
	github.com/sawka/txwrap v0.2.0
	github.com/spf13/cobra v1.8.0
	github.com/wavetermdev/waveterm/wavesrv v0.0.0-20240508181017-d07068c09d94
	golang.org/x/crypto v0.25.0
	golang.org/x/term v0.22.0
)

require (
	github.com/felixge/httpsnoop v1.0.3 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stretchr/testify v1.8.4 // indirect
	go.uber.org/atomic v1.7.0 // indirect
	golang.org/x/sys v0.22.0 // indirect
)

replace github.com/kevinburke/ssh_config => github.com/wavetermdev/ssh_config v0.0.0-20240306041034-17e2087ebde2

# setup-cpp

Install all the tools required for building and testing C++/C projects.

![Build Status (Github Actions)](https://github.com/aminya/setup-cpp/workflows/CI/badge.svg)

Setting up a **cross-platform** environment for building and testing C++/C projects is a bit tricky. Each platform has its own compilers, and each of them requires a different installation procedure. This package aims to fix this issue.

This package is designed to be **modular** and as **minimal** as possible. This will allow you to install the tools you want. It is continuously tested on Windows, Linux, and macOS.

The package can be used locally or from CI services like GitHub Actions.

# Features

`setup-cpp` can install all of these tools:

- cmake
- ninja
- llvm
- gcc
- msvc
- vcvarsall
- vcpkg
- meson
- conan
- make
- task
- ccache
- cppcheck
- clangtidy
- clangformat
- doxygen
- gcovr
- opencppcoverage
- kcov

`setup-cpp` can also install the following. These are automatically installed if needed for the above Cpp tools (e.g., python is required for conan).

- python
- choco
- brew
- sevenzip
- graphviz

# Usage

## From Terminal

You should download the executable file or the js file (if Nodejs installed), and run it with the available options.

Tip: You can automate downloading using `wget`, `curl`, or other similar tools.

### Executable

Download the executable for your platform from [here](https://github.com/aminya/setup-cpp/releases/tag/v0.9.4), and run it with the available options.

An example that installs llvm, cmake, ninja, ccache, and vcpkg:

```ps1
# windows example (open shell as admin)
curl -LJO "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp_windows.exe"
./setup_cpp_windows  --cmake true --ccache true --vcpkg true

RefreshEnv.cmd # reload the environment
```

```ps1
# linux example
wget "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp_linux"
chmod +x setup_cpp_linux
sudo ./setup_cpp_linux  --cmake true --ccache true 

source ~/.profile # reload the environment
```

```ps1
# mac example
wget "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp_mac"
chmod +x setup_cpp_mac
sudo ./setup_cpp_mac --cmake true --ccache true

source ~/.profile # reload the environment
```

NOTE: In the `compiler` entry, you can specify the version after `-` like `llvm-11.0.0`.
For the tools, instead of `true` that chooses the default version, you can pass a specific version.

NOTE: you will not need `sudo` if you are already a root user (e.g., in a GitLab runner).

### With Nodejs

Download the `setup_cpp.js` file form [here](https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp.js), and run it with the available options.

On Windows:

Open the shell as admin, download via `curl`, then install

```ps1
# open shell as admin
curl -LJO "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp.js"
node ./setup_cpp.js --compiler llvm --cmake true --ninja true --ccache true --vcpkg true

RefreshEnv.cmd # reload the environment
```

On Linux or Mac:

```ps1
wget "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp.js"
sudo node ./setup_cpp.js --compiler llvm --cmake true --ninja true --ccache true --vcpkg true

source ~/.profile # reload the environment
```

## Inside GitHub Actions

Here is a complete cross-platform example that tests llvm, gcc, and msvc. It also uses cmake, ninja, vcpkg, and cppcheck.

`.github/workflows/ci.yml`:

```yaml
name: ci
on:
  pull_request:
  push:
    branches:
      - main
      - master

jobs:
  Test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os:
          - windows-2022
          - ubuntu-20.04
          - macos-11
        compiler:
          - llvm
          - gcc
          # you can specify the version after `-` like `llvm-13.0.0`.
        include:
          - os: "windows-2022"
            compiler: "msvc"
    steps:
      - uses: actions/checkout@v2
      - name: Cache
        uses: actions/cache@v2
        with:
          path: |
            ~/vcpkg
            ./build/vcpkg_installed
            ${{ env.HOME }}/.cache/vcpkg/archives
            ${{ env.XDG_CACHE_HOME }}/vcpkg/archives
            ${{ env.LOCALAPPDATA }}\vcpkg\archives
            ${{ env.APPDATA }}\vcpkg\archives
          key: ${{ runner.os }}-${{ matrix.compiler }}-${{ env.BUILD_TYPE }}-${{ hashFiles('**/CMakeLists.txt') }}-${{ hashFiles('./vcpkg.json')}}
          restore-keys: |
            ${{ runner.os }}-${{ env.BUILD_TYPE }}-

      - name: Setup Cpp
        uses: aminya/setup-cpp@v1
        with:
          compiler: ${{ matrix.compiler }}
          vcvarsall: ${{ contains(matrix.os, 'windows') }}
          cmake: true
          ninja: true
          vcpkg: true
          cppcheck: true
          clangtidy: true # instead of `true`, which chooses the default version, you can pass a specific version.
          # ...
```

## Inside Docker

Here is an example for using setup_cpp to make a builder image that has the Cpp tools you need.

```dockerfile
FROM ubuntu:devel

# add setup_cpp
WORKDIR "/"
RUN apt-get update -qq
RUN apt-get install -y --no-install-recommends wget
RUN wget --no-verbose "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp_linux"
RUN chmod +x ./setup_cpp_linux

# install llvm, cmake, ninja, and ccache
RUN ./setup_cpp_linux --compiler llvm --cmake true --ninja true --ccache true

# reload the environment
RUN source ~/.profile

ENTRYPOINT [ "/bin/sh" ]
```

See [this folder](https://github.com/aminya/setup-cpp/tree/master/building/docker), for some dockerfile examples.

If you want to build the ones included, then run:

```ps1
docker build -f ./building/docker/ubuntu.dockerfile -t setup_cpp .
```

Where you should use the path to the dockerfile after `-f`.

After build, run the following to start an interactive shell in your container

```ps1
docker run -it setup_cpp
```

## Inside Docker inside GitHub Actions

You can use the docker file discussed in the previous section inside GitHub Actions like the following:

```yaml
jobs:
  Docker:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os:
          - ubuntu-20.04
    steps:
      - uses: actions/checkout@v2
      - name: Build
        id: docker_build
        run: |
          docker build -f ./building/docker/debian.dockerfile -t setup_cpp .
        env:
          ACTIONS_ALLOW_UNSECURE_COMMANDS: true
```

## Inside GitLab pipelines

The following gives an example for setting up a C++ environment inside GitLab pipelines.

.gitlab-ci.yaml

```yaml
image: ubuntu:devel

stages:
  - test

.setup_linux: &setup_linux |
  DEBIAN_FRONTEND=noninteractive

  # set time-zone
  TZ=Canada/Pacific
  ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

  # for downloading
  apt-get update -qq
  apt-get install -y --no-install-recommends curl gnupg ca-certificates

  # keys used by apt
  apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 3B4FE6ACC0B21F32
  apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 40976EAF437D05B5
  apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1E9377A2BA9EF27F

.setup_cpp: &setup_cpp |
  curl -LJO "https://github.com/aminya/setup-cpp/releases/download/v0.9.4/setup_cpp_linux"
  chmod +x setup_cpp_linux
  ./setup_cpp_linux --compiler $compiler --cmake true --ninja true --ccache true --vcpkg true
  source ~/.profile

.test: &test |
  # Build and Test
  # ...

test_linux_llvm:
  stage: test
  variables:
    compiler: llvm
  script:
    - *setup_linux
    - *setup_cpp
    - *test

test_linux_gcc:
  stage: test
  variables:
    compiler: gcc
  script:
    - *setup_linux
    - *setup_cpp
    - *test
```

# Articles

[Setup-Cpp on Dev.to](https://dev.to/aminya/setup-cpp-3ia4)

# Usage Examples

- [cpp-best-practices starter project](https://github.com/cpp-best-practices/cpp_starter_project)
- [libclang](https://github.com/atilaneves/libclang)
- [dpp](https://github.com/atilaneves/dpp)
- [d-tree-sitter](https://github.com/aminya/d-tree-sitter)

See all of the usage examples on GitHub [here](https://github.com/search?q=aminya%2Fsetup-cpp+path%3A.github%2Fworkflows%2F+language%3AYAML+fork%3Atrue&type=code).

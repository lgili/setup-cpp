import { setupCmake } from "../cmake"
import { setupTmpDir, cleanupTmpDir, testBin } from "../../utils/tests/test-helpers"
import { isGitHubCI } from "../../utils/env/isci"

jest.setTimeout(300000)

describe("setup-cmake", () => {
  let directory: string
  beforeAll(async () => {
    directory = await setupTmpDir("cmake")
  })

  it("should setup CMake", async () => {
    const { binDir } = await setupCmake("3.20.2", directory, process.arch)
    await testBin("cmake", ["--version"], binDir)
  })

  it("should find CMake in the cache", async () => {
    const { binDir } = await setupCmake("3.20.2", directory, process.arch)
    await testBin("cmake", ["--version"], binDir)
    if (isGitHubCI()) {
      expect(binDir).toMatch(process.env.RUNNER_TOOL_CACHE ?? "hostedtoolcache")
    }
  })

  afterAll(async () => {
    await cleanupTmpDir("cmake")
  }, 100000)
})

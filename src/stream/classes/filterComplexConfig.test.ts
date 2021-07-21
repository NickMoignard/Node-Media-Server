import FilterComplexConfig from "./filterComplexConfig"

const fcConf = new FilterComplexConfig()


test('base stream filter example to be correct', () => {
    const args = fcConf.filterComplexArgs()
    const example = ["-filter_complex", `"[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=w=-1:h=720[v2out]; [v3]scale=w=-1:h=360[v3out]"`]

    expect(args).toEqual(example)
})

# CTFBench

CTFBench ( [ctfbench.com](https://ctfbench.com/) ) is a benchmark designed for evaluating AI-powered smart contract auditors. This repository contains the methodology, test contracts, and documentation to help developers assess the effectiveness of automated auditors using objective measures.

## Testing Contracts and Reports

check folder `benchmark_data` for the testing contracts and reports.

## Reproducing the Results

Set your openrouter api key in `.env` file.

Run
```bash
python tools/bench_synopsis.py ./benchmark_data/synopsis ./benchmark_data/reports/with_errors/savant
```

You will get a number of synopsis matches in the reports for vulnerable contracts.



Run

```bash
python tools/bench_zero_errors.py ./benchmark_data/reports/no_errors/savant
```

You will get a number of false positives or non-critical advices in the reports for non-vulnerable contracts.

## Overview

In the current landscape, smart contract security tools struggle with a trade-off between detecting vulnerabilities and minimizing false positives. CTFBench addresses this challenge by introducing two key metrics:

- **Vulnerability Detection Rate (VDR):** The ratio of correctly identified vulnerabilities.
- **Overreporting Index (OI):** The proportion of false positives relative to total alerts.

Each test contract in CTFBench contains exactly one predetermined vulnerability, allowing for clear and objective verification of tool performance.

## Repository Structure

- **article.md:** A comprehensive description of the CTFBench methodology along with an in-depth analysis of auditor typologies using the VDR–OI space.
- **README.md:** This file, providing an overview of the benchmark and instructions for getting started.
- **assets/**: Directory for images and visualizations illustrating the benchmark methodology.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/CTFBench.git
   ```

2. **Dive into the Documentation:**
   - Read `article.md` for detailed insights into the benchmark methodology.
   - Check the `assets/` folder for visual aids and diagrams.

3. **Usage:**
   - Integrate your AI-based smart contract auditing tool with the test contracts provided.
   - Evaluate its performance by calculating the **VDR** and **OI** metrics.

## Contributing

Contributions are welcome! If you have suggestions, test cases, or improvements in mind, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 

from dataclasses import dataclass
from config import Config


@dataclass
class CostReport:
    original_tokens: int
    summary_tokens: int
    reduction_percentage: float
    original_cost: float
    summary_cost: float
    preprocessing_cost: float
    money_saved: float
    savings_percentage: float
    break_even: int


def analyze_costs(
    original_tokens: int,
    summary_tokens: int,
) -> CostReport:
    input_rate = Config.COST_INPUT_PER_TOKEN
    output_rate = Config.COST_OUTPUT_PER_TOKEN

    original_cost = original_tokens * input_rate
    summary_cost = summary_tokens * input_rate

    reduction_percentage = (
        (1 - summary_tokens / original_tokens) * 100
        if original_tokens > 0
        else 0.0
    )

    money_saved = original_cost - summary_cost
    savings_percentage = (
        (money_saved / original_cost) * 100 if original_cost > 0 else 0.0
    )

    preprocessing_cost = (
        original_tokens * input_rate
        + summary_tokens * output_rate
    )

    savings_per_query = money_saved
    break_even = (
        int(preprocessing_cost // savings_per_query) + 1
        if savings_per_query > 0
        else 0
    )

    return CostReport(
        original_tokens=original_tokens,
        summary_tokens=summary_tokens,
        reduction_percentage=round(reduction_percentage, 2),
        original_cost=round(original_cost, 6),
        summary_cost=round(summary_cost, 6),
        money_saved=round(money_saved, 6),
        savings_percentage=round(savings_percentage, 2),
        preprocessing_cost=round(preprocessing_cost, 6),
        break_even=break_even,
    )

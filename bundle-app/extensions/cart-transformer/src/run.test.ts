import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from './run';
import { FunctionRunResult } from '../generated/api';

describe('cart transform function', () => {
  // Test for empty cart case
  it('returns no operations when cart is empty', () => {
    const result = run({
      cart: {
        lines: []
      },
      presentmentCurrencyRate: 1.0
    });
    const expected: FunctionRunResult = { operations: [] };
    
    expect(result).toEqual(expected);
  });
  
  // Test for cart with no bundle items
  it('returns no operations when cart has no bundle items', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_id",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: null
              }
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = { operations: [] };
    expect(result).toEqual(expected);
  });
  
  // Test for cart with bundle items but no bundle index
  it('returns no operations when bundle items have no bundle index', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_id",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        offer: 10,
                        selectedProducts: []
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: null,
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = { operations: [] };
    expect(result).toEqual(expected);
  });
  
  // Test for cart with valid bundle items
  it('returns expand operations for valid bundle items', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        offer: 10,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                quantity: 2,
                                amount: 50
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 2,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '10.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 1'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for multiple cart lines with bundles
  it('processes multiple cart lines with bundles correctly', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        offer: 10,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                quantity: 1,
                                amount: 50
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          },
          {
            id: 'line_2',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 2',
                        offer: 20,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_2',
                                quantity: 2,
                                amount: 80
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 200
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '10.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 1'
          }
        },
        {
          expand: {
            cartLineId: 'line_2',
            expandedCartItems: [
              {
                merchandiseId: 'variant_2',
                quantity: 2,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '40.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 2'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for bundle with multiple products and variants
  it('handles bundles with multiple products and variants', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Complete Bundle',
                        offer: 15,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                quantity: 1,
                                amount: 50
                              }
                            ]
                          },
                          {
                            variants: [
                              {
                                id: 'variant_2',
                                quantity: 2,
                                amount: 30
                              },
                              {
                                id: 'variant_3',
                                quantity: 1,
                                amount: 25
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 150
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '22.50'
                    }
                  }
                }
              },
              {
                merchandiseId: 'variant_2',
                quantity: 2,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '22.50'
                    }
                  }
                }
              },
              {
                merchandiseId: 'variant_3',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '22.50'
                    }
                  }
                }
              }
            ],
            title: 'Complete Bundle'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for currency conversion
  it('applies currency conversion rate correctly', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        offer: 10,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                quantity: 1,
                                amount: 50
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.5
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '15.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 1'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for default offer when missing
  it('uses default 10% offer when offer is missing', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        // No offer specified, should default to 10%
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                quantity: 1,
                                amount: 50
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '10.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 1'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for default quantity when missing
  it('uses default quantity of 1 when quantity is missing', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              id: "variant_1",
              __typename: 'ProductVariant',
              product: {
                __typename: "Product",
                bundledComponentData: {
                  jsonValue: {
                    bundles: [
                      {
                        displayText: 'Bundle 1',
                        offer: 10,
                        selectedProducts: [
                          {
                            variants: [
                              {
                                id: 'variant_1',
                                // No quantity specified, should default to 1
                                amount: 50
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = {
      operations: [
        {
          expand: {
            cartLineId: 'line_1',
            expandedCartItems: [
              {
                merchandiseId: 'variant_1',
                quantity: 1,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: '10.00'
                    }
                  }
                }
              }
            ],
            title: 'Bundle 1'
          }
        }
      ]
    };
    
    expect(result).toEqual(expected);
  });
  
  // Test for error handling with empty bundles
  it('throws error when bundle data is empty', () => {
    expect(() => {
      run({
        cart: {
          lines: [
            {
              id: 'line_1',
              merchandise: {
                id: "variant_1",
                __typename: 'ProductVariant',
                product: {
                  __typename: "Product",
                  bundledComponentData: {
                    jsonValue: {
                      bundles: [] // Empty bundles array
                    }
                  }
                }
              },
              bundleIndex: {
                value: "0"
              },
              cost: {
                amountPerQuantity: {
                  amount: 100
                }
              }
            }
          ]
        },
        presentmentCurrencyRate: 1.0
      });
    }).toThrow('Invalid bundle composition');
  });
  
  // Test for non-ProductVariant merchandise
  it('ignores non-ProductVariant merchandise', () => {
    const result = run({
      cart: {
        lines: [
          {
            id: 'line_1',
            merchandise: {
              __typename: 'CustomProduct', // Not a ProductVariant
            },
            bundleIndex: {
              value: "0"
            },
            cost: {
              amountPerQuantity: {
                amount: 100
              }
            }
          }
        ]
      },
      presentmentCurrencyRate: 1.0
    });
    
    const expected: FunctionRunResult = { operations: [] };
    expect(result).toEqual(expected);
  });
});
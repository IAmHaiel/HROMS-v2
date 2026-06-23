using System;
using System.Collections.Generic;
using System.Linq;

namespace OTMS.Common.Helpers
{
    /// <summary>
    /// Provides text similarity calculations using the Jaccard Similarity Index.
    /// 
    /// The Jaccard Index is a well-established metric in information retrieval and
    /// Natural Language Processing (NLP) for measuring the similarity between two
    /// finite sets. It is defined as the size of the intersection divided by the
    /// size of the union of the sets: J(A, B) = |A ∩ B| / |A ∪ B|.
    /// 
    /// A 70% (0.70) threshold is commonly used in duplicate detection systems as it 
    /// balances precision and recall — high enough to avoid excessive false positives
    /// from loosely related content, yet sensitive enough to catch meaningful overlaps.
    /// 
    /// References:
    /// - Jaccard, P. (1912). "The Distribution of the Flora in the Alpine Zone."
    ///   New Phytologist, 11(2), 37–50.
    /// - Leskovec, J., Rajaraman, A., Ullman, J.D. (2014). "Mining of Massive Datasets."
    ///   Cambridge University Press. Chapter 3: Finding Similar Items.
    /// </summary>
    public static class TextSimilarityHelper
    {
        /// <summary>
        /// Calculates the Jaccard Similarity between two strings by tokenizing them
        /// into individual words and comparing the token sets.
        /// Returns a value between 0.0 (completely different) and 1.0 (identical).
        /// </summary>
        public static double CalculateJaccardSimilarity(string text1, string text2)
        {
            if (string.IsNullOrWhiteSpace(text1) && string.IsNullOrWhiteSpace(text2))
                return 1.0;

            if (string.IsNullOrWhiteSpace(text1) || string.IsNullOrWhiteSpace(text2))
                return 0.0;

            var tokens1 = Tokenize(text1);
            var tokens2 = Tokenize(text2);

            if (tokens1.Count == 0 && tokens2.Count == 0)
                return 1.0;

            var intersection = tokens1.Intersect(tokens2).Count();
            var union = tokens1.Union(tokens2).Count();

            if (union == 0)
                return 0.0;

            return (double)intersection / union;
        }

        /// <summary>
        /// Computes a weighted similarity score combining Title and Description.
        /// Title is weighted at 60% and Description at 40%.
        /// </summary>
        public static double CalculateWeightedSimilarity(
            string title1, string? description1,
            string title2, string? description2)
        {
            double titleSimilarity = CalculateJaccardSimilarity(title1, title2);
            double descriptionSimilarity = CalculateJaccardSimilarity(
                description1 ?? string.Empty,
                description2 ?? string.Empty);

            return (titleSimilarity * 0.60) + (descriptionSimilarity * 0.40);
        }

        private static HashSet<string> Tokenize(string text)
        {
            return text
                .ToLowerInvariant()
                .Split(new[] { ' ', '\t', '\n', '\r', ',', '.', ';', ':', '!', '?' },
                    StringSplitOptions.RemoveEmptyEntries)
                .ToHashSet();
        }
    }
}
